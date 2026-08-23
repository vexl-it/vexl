/**
 * End-to-end test of the places ingest pipeline
 * (tooling/location-db-updater/scripts/ingest.ts):
 * geojsonseq parsing → transform → staging inserts → street merging →
 * importance boosting → index build → sanity gate → atomic table swap — and
 * finally the long-lived geocoding query layer reading the replaced tables.
 *
 * The real script runs as a subprocess against the per-test-file Postgres
 * database, with `osmium` stubbed by a shell script that emits a crafted
 * geojsonseq fixture, so the whole pipeline after the osmium boundary is
 * exercised for real.
 */
import {NodeContext} from '@effect/platform-node'
import {PgClient} from '@effect/sql-pg'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {computeImportance} from '@vexl-next/geocoding-db/src/common'
import {GeocodingDbLayer} from '@vexl-next/geocoding-db/src/layer'
import {
  disposeGeocodingTestDatabase,
  setupGeocodingTestDatabase,
} from '@vexl-next/geocoding-db/src/tests/testGeocodingDb'
import {Effect, Layer, ManagedRuntime, Option} from 'effect'
import {execFile} from 'node:child_process'
import {chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

const RS = '\u001e'
const LOCATION_DB_UPDATER_ROOT = path.resolve(__dirname, '../..')

const dbRuntime = ManagedRuntime.make(
  Layer.empty.pipe(
    Layer.provideMerge(GeocodingDbService.Live),
    Layer.provideMerge(GeocodingDbLayer),
    Layer.provideMerge(NodeContext.layer)
  )
)

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const feature = (
  id: string,
  geometry: {type: string; coordinates: unknown},
  properties: Record<string, string>
): string => RS + JSON.stringify({id, geometry, properties})

const node = (
  id: string,
  lon: number,
  lat: number,
  properties: Record<string, string>
): string => feature(id, {type: 'Point', coordinates: [lon, lat]}, properties)

const way = (
  id: string,
  coordinates: Array<[number, number]>,
  properties: Record<string, string>
): string => feature(id, {type: 'LineString', coordinates}, properties)

const square = (
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): Array<[number, number]> => [
  [minLon, minLat],
  [maxLon, minLat],
  [maxLon, maxLat],
  [minLon, maxLat],
  [minLon, minLat],
]

const circle = (
  centerLon: number,
  centerLat: number,
  radius: number,
  vertices: number
): Array<[number, number]> => {
  const ring = Array.from({length: vertices}, (unused, index) => {
    const angle = (index / vertices) * Math.PI * 2
    return [
      centerLon + Math.cos(angle) * radius,
      centerLat + Math.sin(angle) * radius,
    ] satisfies [number, number]
  })
  return [...ring, ring[0]]
}

const largeBoundaryGeometry = {
  type: 'Polygon',
  coordinates: [circle(13.5, 49.5, 0.2, 2200)],
}

/**
 * 600 vertices alternating between two radii 0.01° apart — every vertex
 * survives the ~10 m simplification, so the polygon must be subdivided.
 */
const spikyBoundaryGeometry = {
  type: 'Polygon',
  coordinates: [
    (() => {
      const ring = Array.from({length: 600}, (unused, index) => {
        const angle = (index / 600) * Math.PI * 2
        const radius = index % 2 === 0 ? 0.2 : 0.21
        return [
          14.0 + Math.cos(angle) * radius,
          50.5 + Math.sin(angle) * radius,
        ] satisfies [number, number]
      })
      return [...ring, ring[0]]
    })(),
  ],
}

/** Self-intersecting "bow tie" — ST_MakeValid must split it into two triangles. */
const bowTieBoundaryGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [13.0, 49.2],
      [13.1, 49.3],
      [13.1, 49.2],
      [13.0, 49.3],
      [13.0, 49.2],
    ],
  ],
}

/** Two rectangular countries roughly where Slovakia and Czechia sit. */
const countriesFixture = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    {
      properties: {ISO_A2_EH: 'SK'},
      geometry: {type: 'Polygon', coordinates: [square(16, 47, 18, 49)]},
    },
    {
      properties: {ISO_A2_EH: 'CZ'},
      geometry: {type: 'Polygon', coordinates: [square(12, 49, 16, 51)]},
    },
  ],
})

const FILLER_COUNT = 2100 // > BATCH_SIZE, forces mid-file flushes

const fillerHamlets = (): string[] =>
  Array.from({length: FILLER_COUNT}, (unused, i) =>
    node(
      `n${1000 + i}`,
      12.05 + (i % 39) * 0.1,
      49.05 + Math.floor(i / 39) * 0.03,
      {
        place: 'hamlet',
        name: `Filler ${i}`,
      }
    )
  )

const mainFixture = (cityName: string): string[] => [
  // Junk the parser must skip silently
  'not json at all',
  '',
  RS,
  node('n900', 17.2, 48.2, {place: 'city'}), // unnamed
  node('n901', 17.2, 48.2, {place: 'locality', name: 'Nowhere'}), // unsupported type

  // Settlements
  node('n1', 17.1, 48.15, {
    place: 'city',
    name: cityName,
    'name:de': 'Pressburg',
    'name:xx': 'Unsupported lang',
    population: '400000',
  }),
  node('n2', 14.5, 50.0, {place: 'town', name: 'Mesto'}),
  node('n3', 13.0, 49.5, {place: 'village', name: 'Dedinka'}),
  node('n50', 0, 0, {place: 'town', name: 'Atlantis'}), // open ocean, no country

  // Boundaries: a cadastral area with a hole, a huge near-circle (simplifies
  // to few vertices), a spiky polygon (must be subdivided), an invalid bow
  // tie (must be repaired), a place polygon, a county-level relation, and a
  // cadastral area outside Czechia (dropped)
  feature(
    'a201',
    {
      type: 'Polygon',
      coordinates: [
        square(14.4, 49.9, 14.6, 50.1),
        square(14.48, 49.98, 14.52, 50.02),
      ],
    },
    {boundary: 'cadastral', name: 'Holešovice'}
  ),
  feature('a203', largeBoundaryGeometry, {
    boundary: 'administrative',
    admin_level: '8',
    place: 'municipality',
    name: 'Large Municipality',
  }),
  feature('a205', spikyBoundaryGeometry, {
    boundary: 'administrative',
    admin_level: '8',
    name: 'Spiky Municipality',
  }),
  feature('a207', bowTieBoundaryGeometry, {
    boundary: 'administrative',
    admin_level: '9',
    name: 'Bow Tie Borough',
  }),
  feature(
    'a210', // area of closed way 105
    {type: 'Polygon', coordinates: [square(17.0, 48.0, 17.2, 48.2)]},
    {place: 'suburb', name: 'Petržalka'}
  ),
  feature(
    'a211',
    {type: 'Polygon', coordinates: [square(12.5, 49.5, 13.5, 50.5)]},
    {boundary: 'administrative', admin_level: '6', name: 'Okres'}
  ),
  feature(
    'a213',
    {type: 'Polygon', coordinates: [square(17.3, 48.3, 17.4, 48.4)]},
    {boundary: 'cadastral', name: 'Slovak cadastre'}
  ),

  // POIs — one inside the city's ~10 km grid cell, one far from any city
  node('n10', 17.1, 48.15, {amenity: 'cafe', name: 'Corner Cafe'}),
  node('n11', 13.0, 49.5, {amenity: 'cafe', name: 'Lonely Cafe'}),

  // Streets — two segments in one grid cell (must merge), one far away
  way(
    'w20',
    [
      [17.099, 48.149],
      [17.1, 48.15],
      [17.101, 48.151],
    ],
    {
      highway: 'residential',
      name: 'Hlavná',
    }
  ),
  way(
    'w21',
    [
      [17.109, 48.151],
      [17.11, 48.152],
      [17.111, 48.153],
    ],
    {
      highway: 'residential',
      name: 'Hlavná',
    }
  ),
  way(
    'w22',
    [
      [17.899, 48.899],
      [17.9, 48.9],
      [17.901, 48.901],
    ],
    {
      highway: 'residential',
      name: 'Hlavná',
    }
  ),

  // Park A: linestring twin then polygon twin of the same closed way 30
  // (a60 = area of way 30) — in-batch geometry upgrade, then a late
  // duplicate that must be skipped
  way(
    'w30',
    [
      [16.4, 48.4],
      [16.5, 48.5],
      [16.55, 48.55],
    ],
    {
      leisure: 'park',
      name: 'Park A',
    }
  ),
  feature(
    'a60',
    {type: 'Polygon', coordinates: [square(16.55, 48.55, 16.65, 48.65)]},
    {leisure: 'park', name: 'Park A'}
  ),
  way(
    'w30',
    [
      [16.4, 48.4],
      [16.5, 48.5],
      [16.55, 48.55],
    ],
    {
      leisure: 'park',
      name: 'Park A',
    }
  ),

  // Park B: linestring twin, then enough fillers to force a flush, then the
  // polygon twin — exercises the post-flush ON CONFLICT upgrade path
  way(
    'w32',
    [
      [16.7, 48.7],
      [16.8, 48.8],
      [16.85, 48.85],
    ],
    {
      leisure: 'park',
      name: 'Park B',
    }
  ),
  ...fillerHamlets(),
  feature(
    'a64',
    {type: 'Polygon', coordinates: [square(16.8, 48.8, 16.9, 48.9)]},
    {leisure: 'park', name: 'Park B'}
  ),
]

const secondFileFixture: string[] = [
  // Duplicate of n2 from the first file — the first row must win
  node('n2', 14.6, 50.1, {place: 'town', name: 'Mesto Duplicate'}),
  node('n40', 13.5, 49.2, {place: 'hamlet', name: 'Samota'}),
]

const EXPECTED_PLACE_COUNT =
  1 + // city
  2 + // towns (Mesto, Atlantis)
  1 + // village
  FILLER_COUNT +
  1 + // hamlet Samota
  2 + // cafes
  2 + // parks
  2 // streets (merged cell + far segment)

// ---------------------------------------------------------------------------
// Subprocess harness
// ---------------------------------------------------------------------------

let workDir: string

const OSMIUM_STUB = `#!/bin/sh
# Test stub for "osmium export <file> -f geojsonseq --add-unique-id=type_id":
# emits the .geojsonseq file sitting next to the .osm.pbf input.
[ "$1" = "export" ] || exit 9
[ -f "$2.fail" ] && exit 3
cat "\${2%.osm.pbf}.geojsonseq"
`

const writePbfFixture = (name: string, lines: string[]): string => {
  const pbfPath = path.join(workDir, `${name}.osm.pbf`)
  writeFileSync(pbfPath, 'fake pbf, content is served by the osmium stub')
  writeFileSync(
    path.join(workDir, `${name}.geojsonseq`),
    lines.join('\n') + '\n'
  )
  return pbfPath
}

const runIngest = async (
  pbfPaths: string[]
): Promise<{code: number; stdout: string; stderr: string}> =>
  await new Promise((resolve) => {
    execFile(
      'pnpm',
      [
        'exec',
        'tsx',
        'scripts/ingest.ts',
        '--countries',
        path.join(workDir, 'ne_countries.geojson'),
        ...pbfPaths,
      ],
      {
        cwd: LOCATION_DB_UPDATER_ROOT,
        maxBuffer: 32 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${path.join(workDir, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`,
        },
      },
      (error, stdout, stderr) => {
        const code =
          error === null ? 0 : typeof error.code === 'number' ? error.code : 1
        resolve({code, stdout, stderr})
      }
    )
  })

interface PlaceAssertRow {
  placeType: string
  name: string
  names: Record<string, string>
  countryCode: string | null
  population: string | null
  importance: number
  latitude: number
  longitude: number
}

interface BoundaryAssertRow {
  name: string
  boundaryType: string
  adminLevel: number | null
  placeTag: string | null
  countryCode: string | null
  areaMeters: number
  partCount: number
  holeCount: number
  maxVertices: number
  invalidCount: number
}

const queryPlaces = async (where: string): Promise<PlaceAssertRow[]> => {
  let result: readonly PlaceAssertRow[] = []
  await dbRuntime.runPromise(
    Effect.gen(function* (_) {
      const sql = yield* _(PgClient.PgClient)
      result = yield* _(
        sql.unsafe<PlaceAssertRow>(
          `SELECT place_type, name, names, country_code, population, importance, latitude, longitude FROM places WHERE ${where} ORDER BY id`
        )
      )
    })
  )
  return [...result]
}

const queryBoundaries = async (where: string): Promise<BoundaryAssertRow[]> => {
  let result: readonly BoundaryAssertRow[] = []
  await dbRuntime.runPromise(
    Effect.gen(function* (_) {
      const sql = yield* _(PgClient.PgClient)
      result = yield* _(
        sql.unsafe<BoundaryAssertRow>(`
          SELECT
            boundary.name,
            boundary.boundary_type,
            boundary.admin_level,
            boundary.place_tag,
            boundary.country_code,
            boundary.area_meters,
            count(geometry.part_index)::int AS part_count,
            sum(ST_NumInteriorRings(geometry.geometry))::int AS hole_count,
            max(ST_NPoints(geometry.geometry))::int AS max_vertices,
            sum(CASE WHEN ST_IsValid(geometry.geometry) THEN 0 ELSE 1 END)::int AS invalid_count
          FROM
            place_boundaries AS boundary
            JOIN place_boundary_geometries AS geometry ON geometry.boundary_id = boundary.id
          WHERE
            ${where}
          GROUP BY
            boundary.id
          ORDER BY
            boundary.id
        `)
      )
    })
  )
  return [...result]
}

const querySingle = async <T extends object>(
  queryText: string,
  params: readonly unknown[] = []
): Promise<T> => {
  let result: T | undefined
  await dbRuntime.runPromise(
    Effect.gen(function* (_) {
      const sql = yield* _(PgClient.PgClient)
      const rows = yield* _(sql.unsafe<T>(queryText, params))
      result = rows[0]
    })
  )
  if (result === undefined) throw new Error('Query returned no rows')
  return result
}

beforeAll(async () => {
  await Effect.runPromise(setupGeocodingTestDatabase)
  await dbRuntime.runPromise(GeocodingDbService)

  workDir = mkdtempSync(path.join(tmpdir(), 'places-ingest-test-'))
  const binDir = path.join(workDir, 'bin')
  const osmiumPath = path.join(binDir, 'osmium')
  mkdirSync(binDir)
  writeFileSync(path.join(workDir, 'ne_countries.geojson'), countriesFixture)
  writeFileSync(osmiumPath, OSMIUM_STUB)
  chmodSync(osmiumPath, 0o755)
})

afterAll(async () => {
  try {
    await Effect.runPromise(dbRuntime.disposeEffect)
  } finally {
    try {
      await Effect.runPromise(disposeGeocodingTestDatabase)
    } finally {
      rmSync(workDir, {recursive: true, force: true})
    }
  }
})

// ---------------------------------------------------------------------------
// Tests — sequential: the initial full run feeds the later swap/gate runs
// ---------------------------------------------------------------------------

describe('places ingest pipeline', () => {
  it('loads a full dataset from geojsonseq to the live tables', async () => {
    const fileA = writePbfFixture('mixed-a', mainFixture('Bratislava'))
    const fileB = writePbfFixture('mixed-b', secondFileFixture)

    const run = await runIngest([fileA, fileB])
    expect(run).toMatchObject({code: 0, stderr: ''})

    const total = await querySingle<{count: number}>(
      'SELECT count(*)::int AS count FROM places'
    )
    expect(total.count).toEqual(EXPECTED_PLACE_COUNT)
  }, 120_000)

  it('stores settlements with translations, population and country code', async () => {
    const [bratislava] = await queryPlaces(`name = 'Bratislava'`)
    expect(bratislava).toMatchObject({
      placeType: 'city',
      names: {de: 'Pressburg'}, // name:xx must be dropped
      countryCode: 'sk',
      population: '400000',
    })
    expect(bratislava.importance).toBeCloseTo(
      computeImportance('city', 400000),
      4
    )
    expect(bratislava.latitude).toBeCloseTo(48.15)
    expect(bratislava.longitude).toBeCloseTo(17.1)

    const [atlantis] = await queryPlaces(`name = 'Atlantis'`)
    expect(atlantis.countryCode).toBeNull()

    // The duplicated id from the second file must not override the first row
    expect(await queryPlaces(`name = 'Mesto Duplicate'`)).toHaveLength(0)
    expect(await queryPlaces(`name = 'Mesto'`)).toHaveLength(1)
  })

  it('stores boundaries with their level, place tag and country code', async () => {
    const [cadastral] = await queryBoundaries(`boundary.name = 'Holešovice'`)
    expect(cadastral).toMatchObject({
      boundaryType: 'cadastral',
      adminLevel: null,
      placeTag: null,
      countryCode: 'cz',
      partCount: 1,
      holeCount: 1, // small polygons keep their holes
    })
    expect(cadastral.areaMeters).toBeGreaterThan(0)

    const [large] = await queryBoundaries(
      `boundary.name = 'Large Municipality'`
    )
    expect(large).toMatchObject({
      boundaryType: 'administrative',
      adminLevel: 8,
      placeTag: 'municipality',
      countryCode: 'cz',
    })

    const [suburb] = await queryBoundaries(`boundary.name = 'Petržalka'`)
    expect(suburb).toMatchObject({
      boundaryType: 'place',
      adminLevel: null,
      placeTag: 'suburb',
      countryCode: 'sk',
    })

    const [county] = await queryBoundaries(`boundary.name = 'Okres'`)
    expect(county).toMatchObject({
      boundaryType: 'administrative',
      adminLevel: 6,
    })

    // Cadastral areas are a Czech-only extra
    expect(await queryBoundaries(`boundary.name = 'Slovak cadastre'`)).toEqual(
      []
    )
  })

  it('simplifies, subdivides and repairs boundary geometry', async () => {
    const all = await queryBoundaries('TRUE')
    expect(all.length).toBeGreaterThan(0)
    for (const boundary of all) {
      expect(boundary.invalidCount).toEqual(0)
      expect(boundary.maxVertices).toBeLessThanOrEqual(256)
      expect(boundary.areaMeters).toBeGreaterThan(0)
    }

    // A 2200-vertex near-circle deviates < 10 m from a much coarser one
    const [large] = await queryBoundaries(
      `boundary.name = 'Large Municipality'`
    )
    expect(large.partCount).toEqual(1)
    expect(large.maxVertices).toBeLessThan(200)

    // Spikes survive simplification, so the polygon gets split into parts
    const [spiky] = await queryBoundaries(
      `boundary.name = 'Spiky Municipality'`
    )
    expect(spiky.partCount).toBeGreaterThan(1)

    // The bow tie became two valid triangles
    const [bowTie] = await queryBoundaries(`boundary.name = 'Bow Tie Borough'`)
    expect(bowTie.partCount).toEqual(2)

    for (const [name, geometry] of [
      ['Large Municipality', largeBoundaryGeometry],
      ['Spiky Municipality', spikyBoundaryGeometry],
    ] as const) {
      const fidelity = await querySingle<{
        symmetricDifferenceRatio: number
        coversCenter: boolean
      }>(
        `
          WITH
            expected AS (
              SELECT ST_SetSRID(ST_GeomFromGeoJSON($1::text), 4326) AS geometry
            ),
            reconstructed AS (
              SELECT ST_Union(geometry) AS geometry
              FROM place_boundary_geometries
              WHERE boundary_id = (
                SELECT id FROM place_boundaries WHERE name = $2
              )
            )
          SELECT
            ST_Area(ST_SymDifference(reconstructed.geometry, expected.geometry))
              / ST_Area(expected.geometry) AS symmetric_difference_ratio,
            ST_Covers(reconstructed.geometry, ST_Centroid(expected.geometry)) AS covers_center
          FROM expected CROSS JOIN reconstructed
        `,
        [JSON.stringify(geometry), name]
      )
      expect(fidelity.symmetricDifferenceRatio).toBeLessThan(0.01)
      expect(fidelity.coversCenter).toBe(true)
    }
  })

  it('reverse geocodes through the ingested boundaries', async () => {
    const inHolesovice = await dbRuntime.runPromise(
      Effect.flatMap(GeocodingDbService, (service) =>
        service.nearestPlace({
          latitude: 49.95,
          longitude: 14.45,
          maxDistanceMeters: 50_000,
        })
      )
    )
    const place = Option.getOrThrow(inHolesovice)
    expect(place.name).toEqual('Holešovice')
    expect(place.placeType).toEqual('suburb')
    // Nearest town node (Mesto) provides the context — no city polygon covers
    expect(Option.getOrThrow(place.cityName)).toEqual('Mesto')

    // Inside the hole, the nearest settlement node is the label instead
    const inHole = await dbRuntime.runPromise(
      Effect.flatMap(GeocodingDbService, (service) =>
        service.nearestPlace({
          latitude: 50.0,
          longitude: 14.5,
          maxDistanceMeters: 50_000,
        })
      )
    )
    expect(Option.getOrThrow(inHole).name).toEqual('Mesto')
  })

  it('indexes original and translated names, normalized and deduplicated', async () => {
    const names = await querySingle<{normNames: string[]}>(`
      SELECT array_agg(norm_name ORDER BY norm_name) AS norm_names
      FROM place_names WHERE place_id = 4
    `)
    expect(names.normNames).toEqual(['bratislava', 'pressburg'])
  })

  it('merges street segments per grid cell and keeps distant ones apart', async () => {
    const streets = await queryPlaces(`place_type = 'street'`)
    expect(streets).toHaveLength(2)

    const [merged, far] = streets
    // min(seg_id) of the merged pair: w20 → 20*4+1
    expect(merged.name).toEqual('Hlavná')
    expect(merged.latitude).toBeCloseTo((48.15 + 48.152) / 2, 6)
    expect(merged.longitude).toBeCloseTo((17.1 + 17.11) / 2, 6)
    expect(merged.countryCode).toEqual('sk')
    expect(far.latitude).toBeCloseTo(48.9)

    const mergedId = await querySingle<{id: number}>(
      `SELECT min(id)::int AS id FROM places WHERE place_type = 'street'`
    )
    expect(mergedId.id).toEqual(20 * 4 + 1)
  })

  it('boosts streets and POIs near important cities, leaving remote ones alone', async () => {
    const cityImportance = computeImportance('city', 400000)

    const [cornerCafe] = await queryPlaces(`name = 'Corner Cafe'`)
    expect(cornerCafe.importance).toBeCloseTo(
      computeImportance('cafe', undefined) + 0.15 * cityImportance,
      3
    )

    const [lonelyCafe] = await queryPlaces(`name = 'Lonely Cafe'`)
    expect(lonelyCafe.importance).toBeCloseTo(
      computeImportance('cafe', undefined),
      4
    )

    const boostedStreet = await querySingle<{importance: number}>(
      `SELECT importance FROM places WHERE id = ${20 * 4 + 1}`
    )
    expect(boostedStreet.importance).toBeCloseTo(
      computeImportance('street', undefined) + 0.15 * cityImportance,
      3
    )

    // The boost must stay in sync in the search table
    const streetName = await querySingle<{importance: number}>(
      `SELECT importance FROM place_names WHERE place_id = ${20 * 4 + 1}`
    )
    expect(streetName.importance).toBeCloseTo(boostedStreet.importance, 5)
  })

  it('upgrades linestring geometry to the polygon twin in and after a batch', async () => {
    const parks = await queryPlaces(`place_type = 'park'`)
    expect(parks).toHaveLength(2)

    const [parkA] = await queryPlaces(`name = 'Park A'`)
    expect(parkA.longitude).toBeCloseTo(16.6) // polygon bbox center
    expect(parkA.latitude).toBeCloseTo(48.6)

    const [parkB] = await queryPlaces(`name = 'Park B'`)
    expect(parkB.longitude).toBeCloseTo(16.85)
    expect(parkB.latitude).toBeCloseTo(48.85)

    // The polygon/linestring twins must have collapsed into single name rows
    const parkANames = await querySingle<{count: number}>(
      `SELECT count(*)::int AS count FROM place_names WHERE place_id = ${30 * 4 + 1}`
    )
    expect(parkANames.count).toEqual(1)
  })

  it('leaves no staging tables and renames all indexes on swap', async () => {
    const staging = await querySingle<{
      placesIngest: string | null
      placeNamesIngest: string | null
      streetSegmentsIngest: string | null
      placeBoundariesIngest: string | null
      placeBoundaryGeometriesIngest: string | null
    }>(`
      SELECT
        to_regclass('places_ingest') AS places_ingest,
        to_regclass('place_names_ingest') AS place_names_ingest,
        to_regclass('street_segments_ingest') AS street_segments_ingest,
        to_regclass('place_boundaries_ingest') AS place_boundaries_ingest,
        to_regclass('place_boundary_geometries_ingest') AS place_boundary_geometries_ingest
    `)
    expect(staging.placesIngest).toBeNull()
    expect(staging.placeNamesIngest).toBeNull()
    expect(staging.streetSegmentsIngest).toBeNull()
    expect(staging.placeBoundariesIngest).toBeNull()
    expect(staging.placeBoundaryGeometriesIngest).toBeNull()

    const indexes = await querySingle<{names: string[]}>(`
      SELECT array_agg(indexname::text ORDER BY indexname) AS names
      FROM pg_indexes
      WHERE tablename IN ('places', 'place_names', 'place_boundary_geometries')
    `)
    expect(indexes.names).toEqual(
      expect.arrayContaining([
        'places_settlement_earth_IX',
        'places_type_IX',
        'places_city_earth_IX',
        'place_names_place_id_IX',
        'place_names_prefix_IX',
        'place_names_trgm_IX',
        'place_names_important_prefix_IX',
        'place_boundary_geometries_geometry_IX',
      ])
    )
    for (const name of indexes.names) expect(name).not.toContain('ingest')

    // The staging tables were UNLOGGED — the swap must have made them durable
    const persistence = await querySingle<{kinds: string[]}>(`
      SELECT array_agg(DISTINCT relpersistence::text) AS kinds
      FROM pg_class
      WHERE relname IN ('places', 'place_names', 'place_boundaries', 'place_boundary_geometries')
    `)
    expect(persistence.kinds).toEqual(['p'])
  })

  it('keeps the live tables when osmium fails mid-ingest', async () => {
    const broken = writePbfFixture('broken', mainFixture('Bratislava'))
    writeFileSync(`${broken}.fail`, '')

    const run = await runIngest([broken])
    expect(run.code).not.toEqual(0)
    expect(run.stderr).toContain('osmium export failed')

    const total = await querySingle<{count: number}>(
      'SELECT count(*)::int AS count FROM places'
    )
    expect(total.count).toEqual(EXPECTED_PLACE_COUNT)
  }, 120_000)

  it('refuses to swap in a drastically smaller dataset', async () => {
    const tiny = writePbfFixture('tiny', [
      node('n1', 17.1, 48.15, {place: 'city', name: 'Only City'}),
    ])

    const run = await runIngest([tiny])
    expect(run.code).not.toEqual(0)
    expect(run.stderr).toContain('Sanity check failed')

    // The previous dataset must still be fully alive
    const total = await querySingle<{count: number}>(
      'SELECT count(*)::int AS count FROM places'
    )
    expect(total.count).toEqual(EXPECTED_PLACE_COUNT)
    expect(await queryPlaces(`name = 'Bratislava'`)).toHaveLength(1)
  }, 120_000)

  it('atomically replaces the previous dataset on a healthy re-run', async () => {
    const fileA = writePbfFixture('renamed-a', mainFixture('Nova Bratislava'))
    const fileB = writePbfFixture('renamed-b', secondFileFixture)

    const run = await runIngest([fileA, fileB])
    expect(run).toMatchObject({code: 0, stderr: ''})

    expect(await queryPlaces(`name = 'Bratislava'`)).toHaveLength(0)
    expect(await queryPlaces(`name = 'Nova Bratislava'`)).toHaveLength(1)

    const total = await querySingle<{count: number}>(
      'SELECT count(*)::int AS count FROM places'
    )
    expect(total.count).toEqual(EXPECTED_PLACE_COUNT)

    // The query layer was initialized before the first ingest, so this proves
    // an existing connection pool keeps working across the table swap.
    const suggestions = await dbRuntime.runPromise(
      Effect.flatMap(GeocodingDbService, (service) =>
        service.suggestPlaces({
          normPhrase: 'nova brat',
          simPhrase: 'nova brat',
          minImportance: 0,
          usePrefix: true,
          useTrigram: false,
          limit: 10,
        })
      )
    )
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.name).toEqual('Nova Bratislava')
  }, 120_000)
})
