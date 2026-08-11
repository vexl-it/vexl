/* eslint-disable no-console */
/**
 * Loads OSM places into the places database. Three kinds of entries:
 *   - settlements (place=* nodes) — searchable and used for reverse geocoding
 *   - POIs (cafés, restaurants, pubs, parks, attractions, …) — searchable only
 *   - streets (named highway ways, deduplicated to one entry per street name
 *     per ~10 km grid cell, no house numbers) — searchable only
 *
 * Input: PBF files pre-filtered by scripts/refresh-places.sh (places-*, pois-*,
 * streets-*; the parser classifies each feature by its tags, so files can be
 * passed in any mix) + a Natural Earth admin-0 countries GeoJSON used to stamp
 * each entry with its ISO country code.
 *
 * The load is atomic: data goes into `places_ingest` / `place_names_ingest`
 * staging tables which replace the live tables in a single transaction at the
 * end, so the service keeps serving the old dataset until the new one is
 * complete. Deterministic and safe to re-run (weekly cron in production).
 *
 * Usage:
 *   pnpm ingest:places -- --countries <ne_countries.geojson> <*.osm.pbf>...
 *
 * Env: DB_URL, DB_USER, DB_PASSWORD (same as the service).
 */
import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import pg from 'pg'
import {
  computeImportance,
  normalizeName,
  POI_TAG_TYPES,
  SETTLEMENT_TYPE_WEIGHTS,
  STREET_HIGHWAY_TYPES,
  SUPPORTED_LANGS,
} from '../src/places/common'

const BATCH_SIZE = 2000
/** ~10 km grid used to merge street segments into one entry per street. */
const STREET_GRID_CELLS_PER_DEGREE = 10

interface PlaceRow {
  id: string
  place_type: string
  name: string
  names: Record<string, string>
  country_code: string | null
  population: string | null
  importance: number
  latitude: number
  longitude: number
  geom_rank: number
}

interface PlaceNameRow {
  place_id: string
  norm_name: string
  importance: number
}

interface StreetSegmentRow {
  seg_id: string
  norm_name: string
  name: string
  country_code: string | null
  latitude: number
  longitude: number
  grid_lat: number
  grid_lon: number
}

// ---------------------------------------------------------------------------
// Country lookup: point-in-polygon against Natural Earth admin-0 countries.
//
// A 1° grid maps each cell to the polygon rings whose bbox overlaps it. Cells
// whose candidate rings all belong to one country resolve without ray casting
// (settlements are always on land, so a single candidate is the answer).
// Only cells near land borders pay for the exact point-in-ring test.
// ---------------------------------------------------------------------------

interface CountryRing {
  countryCode: string
  // Outer ring or hole; holes subtract from containment via even-odd rule
  ring: Array<[number, number]>
  bbox: [number, number, number, number]
}

const ringBbox = (
  ring: Array<[number, number]>
): [number, number, number, number] => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

const isPolygonCoordinates = (
  value: unknown
): value is Array<Array<[number, number]>> =>
  Array.isArray(value) &&
  value.every(
    (ring) =>
      Array.isArray(ring) &&
      ring.every(
        (point) =>
          Array.isArray(point) &&
          typeof point[0] === 'number' &&
          typeof point[1] === 'number'
      )
  )

const pointInRing = (
  x: number,
  y: number,
  ring: Array<[number, number]>
): boolean => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

class CountryIndex {
  private readonly grid = new Map<number, CountryRing[]>()
  private readonly polygons = new Map<string, CountryRing[][]>()

  private cellKey(lon: number, lat: number): number {
    return (Math.floor(lon) + 180) * 200 + (Math.floor(lat) + 90)
  }

  constructor(geojson: {
    features: Array<{
      properties: Record<string, unknown>
      geometry: {type: string; coordinates: unknown}
    }>
  }) {
    for (const feature of geojson.features) {
      const props = feature.properties
      const isoCandidates = [props.ISO_A2_EH, props.ISO_A2, props.WB_A2]
      const iso = isoCandidates.find(
        (one) => typeof one === 'string' && /^[A-Za-z]{2}$/.test(one)
      )
      if (typeof iso !== 'string') continue
      const countryCode = iso.toLowerCase()

      const rawCoordinates = feature.geometry.coordinates
      const geometryPolygons: Array<Array<Array<[number, number]>>> = []
      if (
        feature.geometry.type === 'Polygon' &&
        isPolygonCoordinates(rawCoordinates)
      ) {
        geometryPolygons.push(rawCoordinates)
      } else if (
        feature.geometry.type === 'MultiPolygon' &&
        Array.isArray(rawCoordinates)
      ) {
        for (const polygon of rawCoordinates) {
          if (isPolygonCoordinates(polygon)) geometryPolygons.push(polygon)
        }
      }

      for (const polygon of geometryPolygons) {
        const rings: CountryRing[] = polygon.map((ring) => ({
          countryCode,
          ring,
          bbox: ringBbox(ring),
        }))
        const existing = this.polygons.get(countryCode) ?? []
        existing.push(rings)
        this.polygons.set(countryCode, existing)

        // Only the outer ring (first) drives grid candidacy
        const outer = rings[0]
        const [minX, minY, maxX, maxY] = outer.bbox
        for (let lon = Math.floor(minX); lon <= Math.floor(maxX); lon++) {
          for (let lat = Math.floor(minY); lat <= Math.floor(maxY); lat++) {
            const key = (lon + 180) * 200 + (lat + 90)
            const cell = this.grid.get(key)
            if (cell === undefined) this.grid.set(key, [outer])
            else cell.push(outer)
          }
        }
      }
    }
  }

  private pointInCountry(
    lon: number,
    lat: number,
    countryCode: string
  ): boolean {
    const polygons = this.polygons.get(countryCode) ?? []
    for (const rings of polygons) {
      const outer = rings[0]
      const [minX, minY, maxX, maxY] = outer.bbox
      if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue
      if (!pointInRing(lon, lat, outer.ring)) continue
      const inHole = rings
        .slice(1)
        .some(
          (hole) =>
            lon >= hole.bbox[0] &&
            lon <= hole.bbox[2] &&
            lat >= hole.bbox[1] &&
            lat <= hole.bbox[3] &&
            pointInRing(lon, lat, hole.ring)
        )
      if (!inHole) return true
    }
    return false
  }

  lookup(lon: number, lat: number): string | null {
    const candidates = this.grid.get(this.cellKey(lon, lat))
    if (candidates === undefined || candidates.length === 0) return null

    const inBbox = candidates.filter(
      (one) =>
        lon >= one.bbox[0] &&
        lon <= one.bbox[2] &&
        lat >= one.bbox[1] &&
        lat <= one.bbox[3]
    )
    const uniqueCountries = [...new Set(inBbox.map((one) => one.countryCode))]
    if (uniqueCountries.length === 0) return null
    // Settlements are on land — a single candidate country needs no exact test
    if (uniqueCountries.length === 1) return uniqueCountries[0]

    for (const countryCode of uniqueCountries) {
      if (this.pointInCountry(lon, lat, countryCode)) return countryCode
    }
    return uniqueCountries[0]
  }
}

// ---------------------------------------------------------------------------
// PBF parsing via `osmium export -f geojsonseq`
// ---------------------------------------------------------------------------

type ParsedFeature =
  | {kind: 'place'; place: PlaceRow; names: PlaceNameRow[]}
  | {kind: 'street'; segment: StreetSegmentRow}

/**
 * OSM ids are only unique per object type (node/way/relation), so the id
 * spaces are interleaved into one bigint: node → id*4, way → id*4+1,
 * relation → id*4+2. Max OSM ids (~2^34) stay far below 2^53.
 *
 * Osmium's type_id ids are `n<id>`, `w<id>` and `a<areaId>` — it never emits
 * `r`; areas assembled from closed ways get areaId = 2×wayId and areas from
 * relations get areaId = 2×relationId+1. Decoding areas back to their source
 * object makes a closed way's area and its linestring twin share one id, so
 * the dedupe can collapse them.
 */
const encodeOsmId = (typedId: string): number | null => {
  const raw = Number(typedId.slice(1))
  if (!Number.isFinite(raw) || raw <= 0) return null
  if (typedId.startsWith('n')) return raw * 4
  if (typedId.startsWith('w')) return raw * 4 + 1
  if (typedId.startsWith('a'))
    return raw % 2 === 0 ? raw * 2 + 1 : (raw - 1) * 2 + 2
  return null
}

/**
 * Polygons outrank other geometries: a closed-way POI arrives both as an `a`
 * polygon and a `w` linestring twin, and the polygon center beats a boundary
 * node picked from the linestring.
 */
const geometryRank = (geometryType: string): number =>
  geometryType === 'Polygon' || geometryType === 'MultiPolygon' ? 1 : 0

const isPositionArray = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number'

/** Representative point of any GeoJSON geometry osmium export produces. */
const geometryCenter = (geometry: {
  type: string
  coordinates: unknown
}): [number, number] | null => {
  const coords = geometry.coordinates
  if (geometry.type === 'Point' && isPositionArray(coords)) return coords
  if (geometry.type === 'LineString' && Array.isArray(coords)) {
    const middle = coords[Math.floor(coords.length / 2)]
    return isPositionArray(middle) ? middle : null
  }
  if (geometry.type === 'MultiLineString' && Array.isArray(coords)) {
    const first = coords[0]
    if (!Array.isArray(first)) return null
    const middle = first[Math.floor(first.length / 2)]
    return isPositionArray(middle) ? middle : null
  }
  if (
    (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') &&
    Array.isArray(coords)
  ) {
    const ring = geometry.type === 'Polygon' ? coords[0] : coords[0]?.[0]
    if (!isPolygonCoordinates(geometry.type === 'Polygon' ? coords : coords[0]))
      return null
    if (!Array.isArray(ring)) return null
    const [minX, minY, maxX, maxY] = ringBbox(ring)
    return [(minX + maxX) / 2, (minY + maxY) / 2]
  }
  return null
}

const poiTypeOf = (props: Record<string, string>): string | null => {
  for (const {tag, values} of POI_TAG_TYPES) {
    const value = props[tag]
    if (value !== undefined && values[value] !== undefined) return values[value]
  }
  return null
}

const pickTranslations = (
  props: Record<string, string>
): Record<string, string> => {
  const names: Record<string, string> = {}
  for (const lang of SUPPORTED_LANGS) {
    const value = props[`name:${lang}`]
    if (value !== undefined && value.trim() !== '') names[lang] = value
  }
  return names
}

const parseFeature = (
  line: string,
  countries: CountryIndex
): ParsedFeature | null => {
  // geojsonseq lines are prefixed with an RFC 8142 RS control character
  const cleanLine = line.startsWith('\u001e') ? line.slice(1) : line
  if (cleanLine.trim() === '') return null

  let feature: {
    id?: string
    geometry?: {type: string; coordinates: unknown}
    properties?: Record<string, string>
  }
  try {
    feature = JSON.parse(cleanLine)
  } catch {
    return null
  }

  const props = feature.properties
  const geometry = feature.geometry
  if (props === undefined || geometry === undefined || feature.id === undefined)
    return null

  const name = props.name
  if (name === undefined || name.trim() === '') return null

  const encodedId = encodeOsmId(feature.id)
  if (encodedId === null) return null

  const center = geometryCenter(geometry)
  if (center === null) return null
  const [longitude, latitude] = center
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

  // Settlements: place=* nodes only (ways/relations duplicate node places)
  const settlementType = props.place
  if (
    settlementType !== undefined &&
    SETTLEMENT_TYPE_WEIGHTS[settlementType] !== undefined
  ) {
    if (!feature.id.startsWith('n')) return null
    const names = pickTranslations(props)
    const populationRaw = props.population
    const populationParsed =
      populationRaw !== undefined ? Number.parseInt(populationRaw, 10) : NaN
    const population =
      Number.isFinite(populationParsed) &&
      populationParsed > 0 &&
      populationParsed < 100_000_000
        ? populationParsed
        : undefined
    const importance = computeImportance(settlementType, population)
    return {
      kind: 'place',
      place: {
        id: String(encodedId),
        place_type: settlementType,
        name,
        names,
        country_code: countries.lookup(longitude, latitude),
        population: population !== undefined ? String(population) : null,
        importance,
        latitude,
        longitude,
        geom_rank: geometryRank(geometry.type),
      },
      names: normNameRows(String(encodedId), name, names, importance),
    }
  }

  // Streets: named highway ways of street-like types
  const highway = props.highway
  if (highway !== undefined) {
    if (!STREET_HIGHWAY_TYPES.has(highway) || !feature.id.startsWith('w'))
      return null
    const normName = normalizeName(name)
    if (normName.length === 0) return null
    return {
      kind: 'street',
      segment: {
        seg_id: String(encodedId),
        norm_name: normName,
        name,
        country_code: countries.lookup(longitude, latitude),
        latitude,
        longitude,
        grid_lat: Math.round(latitude * STREET_GRID_CELLS_PER_DEGREE),
        grid_lon: Math.round(longitude * STREET_GRID_CELLS_PER_DEGREE),
      },
    }
  }

  // POIs
  const poiType = poiTypeOf(props)
  if (poiType !== null) {
    const names = pickTranslations(props)
    const importance = computeImportance(poiType, undefined)
    return {
      kind: 'place',
      place: {
        id: String(encodedId),
        place_type: poiType,
        name,
        names,
        country_code: countries.lookup(longitude, latitude),
        population: null,
        importance,
        latitude,
        longitude,
        geom_rank: geometryRank(geometry.type),
      },
      names: normNameRows(String(encodedId), name, names, importance),
    }
  }

  return null
}

const normNameRows = (
  placeId: string,
  name: string,
  names: Record<string, string>,
  importance: number
): PlaceNameRow[] => {
  const normNames = [
    ...new Set(
      [name, ...Object.values(names)]
        .map(normalizeName)
        .filter((one) => one.length > 0)
    ),
  ]
  return normNames.map((normName) => ({
    place_id: placeId,
    norm_name: normName,
    importance,
  }))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const parseArgs = (): {countriesPath: string; pbfPaths: string[]} => {
  const args = process.argv.slice(2)
  let countriesPath: string | undefined
  const pbfPaths: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--countries') {
      countriesPath = args[i + 1]
      i++
    } else {
      pbfPaths.push(args[i])
    }
  }
  if (countriesPath === undefined || pbfPaths.length === 0) {
    console.error(
      'Usage: ingestPlaces.ts --countries <ne_countries.geojson> <*.osm.pbf>...'
    )
    process.exit(1)
  }
  for (const path of [countriesPath, ...pbfPaths]) {
    if (!existsSync(path)) {
      console.error(`File not found: ${path}`)
      process.exit(1)
    }
  }
  return {countriesPath, pbfPaths}
}

const connectDb = async (): Promise<pg.Client> => {
  const dbUrl = process.env.DB_URL
  if (dbUrl === undefined) {
    console.error('DB_URL env var is required')
    process.exit(1)
  }
  const parsed = new URL(dbUrl)
  const client = new pg.Client({
    host: parsed.hostname,
    port: parsed.port !== '' ? Number(parsed.port) : 5432,
    database: parsed.pathname.slice(1),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })
  await client.connect()
  return client
}

/** Multi-row INSERT, chunked to stay under the 65535 query parameter limit. */
const insertRows = async <T extends object>(
  client: pg.Client,
  table: string,
  columns: Array<Extract<keyof T, string>>,
  rows: T[],
  onConflict = ''
): Promise<void> => {
  const rowsPerQuery = Math.floor(60_000 / columns.length)
  for (let start = 0; start < rows.length; start += rowsPerQuery) {
    const chunk = rows.slice(start, start + rowsPerQuery)
    const values: unknown[] = []
    const tuples = chunk.map(
      (row) =>
        `(${columns
          .map((column) => {
            values.push(row[column])
            return `$${values.length}`
          })
          .join(', ')})`
    )
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')} ${onConflict}`,
      values
    )
  }
}

const main = async (): Promise<void> => {
  const startedAt = Date.now()
  const {countriesPath, pbfPaths} = parseArgs()

  console.log(`Loading country boundaries from ${countriesPath}`)
  const countries = new CountryIndex(
    JSON.parse(await readFile(countriesPath, 'utf8'))
  )

  const client = await connectDb()

  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
  await client.query(`CREATE EXTENSION IF NOT EXISTS cube`)
  await client.query(`CREATE EXTENSION IF NOT EXISTS earthdistance`)

  console.log('Preparing staging tables')
  await client.query(`DROP TABLE IF EXISTS place_names_ingest`)
  await client.query(`DROP TABLE IF EXISTS places_ingest`)
  await client.query(`DROP TABLE IF EXISTS street_segments_ingest`)
  await client.query(`
    CREATE UNLOGGED TABLE places_ingest (
      id bigint PRIMARY KEY,
      place_type varchar NOT NULL,
      name varchar NOT NULL,
      names jsonb NOT NULL DEFAULT '{}'::jsonb,
      country_code varchar,
      population bigint,
      importance real NOT NULL,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      geom_rank smallint NOT NULL DEFAULT 0
    )
  `)
  await client.query(`
    CREATE UNLOGGED TABLE place_names_ingest (
      place_id bigint NOT NULL,
      norm_name varchar NOT NULL,
      importance real NOT NULL
    )
  `)
  await client.query(`
    CREATE UNLOGGED TABLE street_segments_ingest (
      seg_id bigint NOT NULL,
      norm_name varchar NOT NULL,
      name varchar NOT NULL,
      country_code varchar,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL,
      grid_lat integer NOT NULL,
      grid_lon integer NOT NULL
    )
  `)

  let totalPlaces = 0
  let totalNames = 0
  let totalSegments = 0
  let skippedDuplicates = 0
  let geometryUpgrades = 0
  // Numeric ids keep the dedupe map small. Street segments are excluded on
  // purpose (tens of millions) — the SQL GROUP BY dedupes them instead.
  const seenGeomRankById = new Map<number, number>()
  const placeBatchById = new Map<number, PlaceRow>()
  let placeBatch: PlaceRow[] = []
  let nameBatch: PlaceNameRow[] = []
  let segmentBatch: StreetSegmentRow[] = []

  const flush = async (): Promise<void> => {
    if (placeBatch.length > 0) {
      await insertRows(
        client,
        'places_ingest',
        [
          'id',
          'place_type',
          'name',
          'names',
          'country_code',
          'population',
          'importance',
          'latitude',
          'longitude',
          'geom_rank',
        ],
        placeBatch,
        `ON CONFLICT (id) DO UPDATE SET
           country_code = EXCLUDED.country_code,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           geom_rank = EXCLUDED.geom_rank
         WHERE places_ingest.geom_rank < EXCLUDED.geom_rank`
      )
      totalPlaces += placeBatch.length
      placeBatch = []
      placeBatchById.clear()
    }
    if (nameBatch.length > 0) {
      await insertRows(
        client,
        'place_names_ingest',
        ['place_id', 'norm_name', 'importance'],
        nameBatch
      )
      totalNames += nameBatch.length
      nameBatch = []
    }
    if (segmentBatch.length > 0) {
      await insertRows(
        client,
        'street_segments_ingest',
        [
          'seg_id',
          'norm_name',
          'name',
          'country_code',
          'latitude',
          'longitude',
          'grid_lat',
          'grid_lon',
        ],
        segmentBatch
      )
      totalSegments += segmentBatch.length
      segmentBatch = []
    }
  }

  for (const pbfPath of pbfPaths) {
    console.log(`Ingesting ${pbfPath}`)
    const osmium = spawn(
      'osmium',
      ['export', pbfPath, '-f', 'geojsonseq', '--add-unique-id=type_id'],
      {stdio: ['ignore', 'pipe', 'inherit']}
    )
    const handleLine = async (line: string): Promise<void> => {
      const parsed = parseFeature(line, countries)
      if (parsed === null) return
      if (parsed.kind === 'street') {
        segmentBatch.push(parsed.segment)
        if (segmentBatch.length >= BATCH_SIZE) await flush()
        return
      }
      // The same id can arrive twice: an object shared by two continent
      // extracts (border areas), or a closed way exported both as an area
      // and as a linestring. Keep the first row, except a higher-ranked
      // geometry which upgrades the stored coordinates (its name rows are
      // identical, so they are never re-inserted).
      const numericId = Number(parsed.place.id)
      const previousRank = seenGeomRankById.get(numericId)
      if (
        previousRank !== undefined &&
        parsed.place.geom_rank <= previousRank
      ) {
        skippedDuplicates++
        return
      }
      seenGeomRankById.set(numericId, parsed.place.geom_rank)
      if (previousRank !== undefined) {
        geometryUpgrades++
        const batched = placeBatchById.get(numericId)
        if (batched !== undefined) {
          batched.country_code = parsed.place.country_code
          batched.latitude = parsed.place.latitude
          batched.longitude = parsed.place.longitude
          batched.geom_rank = parsed.place.geom_rank
          return
        }
        // The first row was already flushed — the insert's ON CONFLICT
        // clause upgrades it in the database instead
        placeBatchById.set(numericId, parsed.place)
        placeBatch.push(parsed.place)
        if (placeBatch.length >= BATCH_SIZE) await flush()
        return
      }
      placeBatchById.set(numericId, parsed.place)
      placeBatch.push(parsed.place)
      nameBatch.push(...parsed.names)
      if (placeBatch.length >= BATCH_SIZE) await flush()
    }

    osmium.stdout.setEncoding('utf8')
    let pending = ''
    for await (const chunk of osmium.stdout) {
      pending += chunk
      const chunkLines = pending.split('\n')
      pending = chunkLines.pop() ?? ''
      for (const line of chunkLines) await handleLine(line)
    }
    if (pending.trim() !== '') await handleLine(pending)

    const exitCode = await new Promise<number>((resolve) => {
      osmium.on('close', (code) => {
        resolve(code ?? 1)
      })
    })
    if (exitCode !== 0) {
      console.error(`osmium export failed for ${pbfPath} (exit ${exitCode})`)
      process.exit(1)
    }
    await flush()
    console.log(
      `  running totals: ${totalPlaces} places, ${totalNames} names, ${totalSegments} street segments`
    )
  }
  await flush()

  if (totalSegments > 0) {
    console.log('Merging street segments into street entries')
    const streetImportance = computeImportance('street', undefined)
    await client.query(
      `
      WITH
        grouped AS (
          SELECT
            min(seg_id) AS id,
            norm_name,
            min(name) AS name,
            min(country_code) AS country_code,
            avg(latitude) AS latitude,
            avg(longitude) AS longitude
          FROM
            street_segments_ingest
          GROUP BY
            norm_name,
            grid_lat,
            grid_lon
        ),
        inserted_places AS (
          INSERT INTO
            places_ingest (
              id,
              place_type,
              name,
              names,
              country_code,
              population,
              importance,
              latitude,
              longitude
            )
          SELECT
            id,
            'street',
            name,
            '{}'::jsonb,
            country_code,
            NULL,
            $1,
            latitude,
            longitude
          FROM
            grouped
          ON CONFLICT (id) DO NOTHING
          RETURNING
            id
        )
      INSERT INTO
        place_names_ingest (place_id, norm_name, importance)
      SELECT
        grouped.id,
        grouped.norm_name,
        $1
      FROM
        grouped
        JOIN inserted_places ON inserted_places.id = grouped.id
    `,
      [streetImportance]
    )
    await client.query(`DROP TABLE street_segments_ingest`)
  }

  // geom_rank only steers the ingest-time area-over-linestring dedupe
  await client.query(`ALTER TABLE places_ingest DROP COLUMN geom_rank`)

  // Streets/POIs near a city node rank above their same-named twins in small
  // towns. Capped at 0.5 so they always stay below the 0.55 "important"
  // threshold (and below every settlement of village rank and up).
  console.log('Boosting streets/POIs near important cities')
  await client.query(`
    WITH
      city_cells AS (
        -- Each city influences its own ~10 km grid cell plus the 8 neighbors
        SELECT
          round(latitude * 10)::int + neighbor_lat.delta AS grid_lat,
          round(longitude * 10)::int + neighbor_lon.delta AS grid_lon,
          max(importance) AS city_importance
        FROM
          places_ingest,
          (
            VALUES
              (-1),
              (0),
              (1)
          ) AS neighbor_lat (delta),
          (
            VALUES
              (-1),
              (0),
              (1)
          ) AS neighbor_lon (delta)
        WHERE
          place_type IN ('city', 'town')
        GROUP BY
          1,
          2
      )
    UPDATE places_ingest p
    SET
      importance = least(0.5, p.importance + 0.15 * cc.city_importance)
    FROM
      city_cells cc
    WHERE
      p.place_type NOT IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
      AND round(p.latitude * 10)::int = cc.grid_lat
      AND round(p.longitude * 10)::int = cc.grid_lon
  `)
  await client.query(`
    UPDATE place_names_ingest pn
    SET
      importance = p.importance
    FROM
      places_ingest p
    WHERE
      pn.place_id = p.id
      AND p.place_type NOT IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
  `)

  console.log('Building indexes')
  await client.query(`
    ALTER TABLE place_names_ingest
    ADD CONSTRAINT place_names_ingest_fk FOREIGN KEY (place_id) REFERENCES places_ingest (id) ON DELETE CASCADE
  `)
  await client.query(`
    CREATE INDEX "places_settlement_earth_IX_ingest" ON places_ingest USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      )
  `)
  await client.query(
    `CREATE INDEX "places_type_IX_ingest" ON places_ingest (place_type)`
  )
  await client.query(`
    CREATE INDEX "places_city_earth_IX_ingest" ON places_ingest USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN ('city', 'town')
  `)
  await client.query(`
    CREATE INDEX "place_names_place_id_IX_ingest" ON place_names_ingest (place_id)
  `)
  await client.query(`
    CREATE INDEX "place_names_prefix_IX_ingest" ON place_names_ingest (norm_name text_pattern_ops) INCLUDE (place_id, importance)
  `)
  await client.query(`
    CREATE INDEX "place_names_trgm_IX_ingest" ON place_names_ingest USING gin (norm_name gin_trgm_ops)
    WHERE
      importance >= 0.55
  `)
  await client.query(`
    CREATE INDEX "place_names_important_prefix_IX_ingest" ON place_names_ingest (norm_name text_pattern_ops) INCLUDE (place_id, importance)
    WHERE
      importance >= 0.55
  `)
  await client.query(`ALTER TABLE places_ingest SET LOGGED`)
  await client.query(`ALTER TABLE place_names_ingest SET LOGGED`)

  // Sanity gate: refuse to replace a healthy dataset with a much smaller one
  const placesTableExists = (
    await client.query<{exists: boolean}>(
      `SELECT to_regclass('places') IS NOT NULL AS exists`
    )
  ).rows[0].exists
  const newCount = (
    await client.query<{count: string}>(
      `SELECT count(*) AS count FROM places_ingest`
    )
  ).rows[0].count
  const previous = placesTableExists
    ? Number(
        (
          await client.query<{count: string}>(
            `SELECT count(*) AS count FROM places`
          )
        ).rows[0].count
      )
    : 0
  if (previous > 0 && Number(newCount) < previous * 0.7) {
    console.error(
      `Sanity check failed: new dataset has ${newCount} places, previous had ${previous}. Aborting swap.`
    )
    process.exit(1)
  }

  console.log('Swapping tables')
  await client.query('BEGIN')
  try {
    await client.query(`DROP TABLE IF EXISTS place_names`)
    await client.query(`DROP TABLE IF EXISTS places`)
    await client.query(`ALTER TABLE places_ingest RENAME TO places`)
    await client.query(`ALTER TABLE place_names_ingest RENAME TO place_names`)
    await client.query(
      `ALTER INDEX "places_settlement_earth_IX_ingest" RENAME TO "places_settlement_earth_IX"`
    )
    await client.query(
      `ALTER INDEX "places_type_IX_ingest" RENAME TO "places_type_IX"`
    )
    await client.query(
      `ALTER INDEX "places_city_earth_IX_ingest" RENAME TO "places_city_earth_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_place_id_IX_ingest" RENAME TO "place_names_place_id_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_prefix_IX_ingest" RENAME TO "place_names_prefix_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_trgm_IX_ingest" RENAME TO "place_names_trgm_IX"`
    )
    await client.query(
      `ALTER INDEX "place_names_important_prefix_IX_ingest" RENAME TO "place_names_important_prefix_IX"`
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
  // VACUUM sets the visibility map so covering-index scans stay index-only.
  // PARALLEL 0 avoids shared-memory limits in constrained containers.
  await client.query(`VACUUM (ANALYZE, PARALLEL 0) places`)
  await client.query(`VACUUM (ANALYZE, PARALLEL 0) place_names`)

  const byType = (
    await client.query<{placeType: string; count: string}>(`
      SELECT
        place_type AS "placeType",
        count(*) AS count
      FROM
        places
      GROUP BY
        place_type
      ORDER BY
        count(*) DESC
    `)
  ).rows
  console.log(`\nDone in ${Math.round((Date.now() - startedAt) / 1000)}s`)
  console.log(
    `${totalPlaces} places, ${totalNames} names, ${totalSegments} street segments, ${skippedDuplicates} duplicates skipped, ${geometryUpgrades} geometry upgrades`
  )
  for (const row of byType) console.log(`  ${row.placeType}: ${row.count}`)

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
