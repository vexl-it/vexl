import * as NodeContext from '@effect/platform-node/NodeContext'
import {PgClient} from '@effect/sql-pg'
import {Effect, Layer, ManagedRuntime, Option} from 'effect'
import {GeocodingDbService} from '../GeocodingDbService'
import {type NearestGeocodingRecord} from '../GeocodingDbService/queries/createQueryNearestPlace'
import {GeocodingDbLayer} from '../layer'
import {
  disposeGeocodingTestDatabase,
  setupGeocodingTestDatabase,
} from '../tests/testGeocodingDb'

process.env.TEST_DB_HOST ??= 'localhost'
process.env.TEST_DB_PORT ??= '5432'
process.env.TEST_DB_USER ??= 'postgres'
process.env.TEST_DB_PASSWORD ??= 'root'
process.env.TEST_DB_PREFIX ??= 'geocoding_db_test_'

const runtime = ManagedRuntime.make(
  GeocodingDbService.Live.pipe(
    Layer.provideMerge(GeocodingDbLayer),
    Layer.provideMerge(NodeContext.layer)
  )
)

/**
 * Fixture world (lon 13-16, lat 49-52):
 *
 *   Praha (level 8, place=city) covers [14.2-14.6, 49.9-50.2]
 *     Praha 7 (level 9)                covers [14.43-14.46, 50.09-50.12]
 *       Holešovice (cadastral)         covers [14.42-14.46, 50.09-50.12]
 *       Bubeneč (cadastral)            covers [14.40-14.42, 50.09-50.12]
 *         (touching Holešovice at lon 14.42 — a 0.0001° sliver is left open)
 *     Josefov node at (14.4175, 50.09) — nearer than the Holešovice centre
 *     Okres Praha (level 6)            covers everything — must be ignored
 *   Rural village polygon (place=village, no city polygon) [15.0-15.1, 51.0-51.1]
 *     Nearby town node at (51.05, 15.2), farther city node at (51.25, 15.2)
 *   Cityville (level 8, untagged, no sub-city polygons) [13.0-13.2, 49.0-49.2]
 *     Cityville city node + Downtown neighbourhood node inside at (49.1, 13.1)
 *     Outsider neighbourhood node just outside at (49.1, 13.21)
 *   Smallville (level 8, untagged) [13.0-13.1, 49.3-49.4] — Cityville node is
 *     the nearest city within 30 km
 *   Kommune (level 7, country no) [13.5-13.6, 51.5-51.6] — city via override
 *   County village node at (51.8, 13.8) — inside Okres Praha only
 *   Fallback village node at (52.5, 13.5) with no boundary at all
 *   Between village node at (52.21, 14.02): Borough City (100k, 0.2 km away)
 *     vs Metropolis (5M, 4.6 km away) — importance wins
 *   Border village node at (52.3, 14.5): Foreign city (de, 5M, 0.1 km) vs
 *     Home town (cz, 3 km) — the label's own country wins
 */
const seedFixtures = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  yield* _(sql`
    INSERT INTO
      places (
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
    VALUES
      (
        1,
        'city',
        'Praha',
        '{"en":"Prague (node)"}'::jsonb,
        'cz',
        1000000,
        1,
        50.08,
        14.42
      ),
      (
        2,
        'neighbourhood',
        'Josefov',
        '{}'::jsonb,
        'cz',
        NULL,
        0.3,
        50.09,
        14.4175
      ),
      (
        3,
        'town',
        'Nearby town',
        '{"en":"Nearby Town EN"}'::jsonb,
        'cz',
        50000,
        0.7,
        51.05,
        15.2
      ),
      (
        4,
        'city',
        'Farther city',
        '{}'::jsonb,
        'cz',
        200000,
        0.9,
        51.25,
        15.2
      ),
      (
        5,
        'neighbourhood',
        'Downtown',
        '{"en":"Downtown EN"}'::jsonb,
        'cz',
        NULL,
        0.3,
        49.1,
        13.1
      ),
      (
        6,
        'neighbourhood',
        'Outsider',
        '{}'::jsonb,
        'cz',
        NULL,
        0.3,
        49.1,
        13.21
      ),
      (
        7,
        'village',
        'Fallback village',
        '{}'::jsonb,
        'cz',
        NULL,
        0.4,
        52.5,
        13.5
      ),
      (
        8,
        'town',
        'Fallback town',
        '{}'::jsonb,
        'cz',
        20000,
        0.7,
        52.52,
        13.5
      ),
      (
        9,
        'city',
        'Cityville',
        '{"en":"Cityville (node)"}'::jsonb,
        'cz',
        100000,
        0.9,
        49.1,
        13.1
      ),
      (
        10,
        'village',
        'County village',
        '{}'::jsonb,
        'cz',
        NULL,
        0.4,
        51.8,
        13.8
      ),
      (
        11,
        'village',
        'Between village',
        '{}'::jsonb,
        'cz',
        NULL,
        0.4,
        52.21,
        14.02
      ),
      (
        12,
        'city',
        'Borough City',
        '{}'::jsonb,
        'cz',
        100000,
        0.914,
        52.212,
        14.022
      ),
      (
        13,
        'city',
        'Metropolis',
        '{}'::jsonb,
        'cz',
        5000000,
        0.987,
        52.25,
        14.0
      ),
      (
        14,
        'village',
        'Border village',
        '{}'::jsonb,
        'cz',
        NULL,
        0.4,
        52.3,
        14.5
      ),
      (
        15,
        'city',
        'Foreign city',
        '{}'::jsonb,
        'de',
        5000000,
        0.987,
        52.301,
        14.5
      ),
      (
        16,
        'town',
        'Home town',
        '{}'::jsonb,
        'cz',
        10000,
        0.73,
        52.33,
        14.5
      );

    INSERT INTO
      place_boundaries (
        id,
        name,
        names,
        country_code,
        boundary_type,
        admin_level,
        place_tag,
        area_meters
      )
    VALUES
      (
        100,
        'Praha',
        '{"en":"Prague"}'::jsonb,
        'cz',
        'administrative',
        8,
        'city',
        400
      ),
      (
        101,
        'Praha 7',
        '{}'::jsonb,
        'cz',
        'administrative',
        9,
        NULL,
        40
      ),
      (
        102,
        'Holešovice',
        '{"en":"Holesovice"}'::jsonb,
        'cz',
        'cadastral',
        NULL,
        NULL,
        20
      ),
      (
        103,
        'Bubeneč',
        '{}'::jsonb,
        'cz',
        'cadastral',
        NULL,
        NULL,
        10
      ),
      (
        104,
        'Okres Praha',
        '{}'::jsonb,
        'cz',
        'administrative',
        6,
        NULL,
        100000
      ),
      (
        105,
        'Rural village',
        '{"en":"Rural Village EN"}'::jsonb,
        'cz',
        'place',
        NULL,
        'village',
        50
      ),
      (
        106,
        'Cityville',
        '{}'::jsonb,
        'cz',
        'administrative',
        8,
        NULL,
        300
      ),
      (
        107,
        'Kommune',
        '{}'::jsonb,
        'no',
        'administrative',
        7,
        NULL,
        300
      ),
      (
        108,
        'Smallville',
        '{}'::jsonb,
        'cz',
        'administrative',
        8,
        NULL,
        100
      );

    INSERT INTO
      place_boundary_geometries (boundary_id, part_index, geometry)
    VALUES
      (
        100,
        0,
        ST_MakeEnvelope (14.2, 49.9, 14.6, 50.2, 4326)
      ),
      (
        101,
        0,
        ST_MakeEnvelope (14.43, 50.09, 14.46, 50.12, 4326)
      ),
      (
        102,
        0,
        ST_MakeEnvelope (14.42, 50.09, 14.44, 50.12, 4326)
      ),
      (
        102,
        1,
        ST_MakeEnvelope (14.44, 50.09, 14.46, 50.12, 4326)
      ),
      (
        103,
        0,
        ST_MakeEnvelope (14.40, 50.09, 14.4199, 50.12, 4326)
      ),
      (104, 0, ST_MakeEnvelope (13, 49, 16, 52, 4326)),
      (
        105,
        0,
        ST_MakeEnvelope (15.0, 51.0, 15.1, 51.1, 4326)
      ),
      (
        106,
        0,
        ST_MakeEnvelope (13.0, 49.0, 13.2, 49.2, 4326)
      ),
      (
        107,
        0,
        ST_MakeEnvelope (13.5, 51.5, 13.6, 51.6, 4326)
      ),
      (
        108,
        0,
        ST_MakeEnvelope (13.0, 49.3, 13.1, 49.4, 4326)
      );
  `)
})

const nearest = async (
  latitude: number,
  longitude: number
): Promise<NearestGeocodingRecord> =>
  Option.getOrThrow(
    await runtime.runPromise(
      Effect.flatMap(GeocodingDbService, (db) =>
        db.nearestPlace({latitude, longitude, maxDistanceMeters: 50_000})
      )
    )
  )

beforeAll(async () => {
  await Effect.runPromise(setupGeocodingTestDatabase)
  await runtime.runPromise(seedFixtures)
})

afterAll(async () => {
  try {
    await Effect.runPromise(runtime.disposeEffect)
  } finally {
    await Effect.runPromise(disposeGeocodingTestDatabase)
  }
})

describe('nearestPlace', () => {
  it('labels with the most specific covering sub-city boundary and its city boundary', async () => {
    // Inside Holešovice (second part), Praha 7 and Praha; Josefov node is nearer
    const place = await nearest(50.1, 14.45)

    expect(place.id).toBe(102n)
    expect(place.name).toBe('Holešovice')
    expect(place.names.en).toBe('Holesovice')
    expect(place.placeType).toBe('suburb')
    expect(place.distanceMeters).toBe(0)
    expect(place.latitude).toBe(50.1)
    expect(place.longitude).toBe(14.45)
    expect(Option.getOrThrow(place.countryCode)).toBe('cz')
    // Context comes from the covering city boundary, not the nearest node
    expect(Option.getOrThrow(place.cityName)).toBe('Praha')
    expect(Option.getOrThrow(place.cityNames).en).toBe('Prague')
  })

  it('never labels with an ignored-role boundary (county level)', async () => {
    // Inside Okres Praha only — the nearest settlement node is the label
    const place = await nearest(51.81, 13.81)
    expect(place.id).toBe(10n)
    expect(place.name).toBe('County village')
    expect(Option.isNone(place.cityName)).toBe(true)
  })

  it('matches a pin in the sliver between two simplified neighbours to the nearest one', async () => {
    // Between Bubeneč (ends at 14.4199) and Holešovice (starts at 14.42),
    // nearer to Bubeneč; only the city boundary covers the pin
    const place = await nearest(50.1, 14.41993)
    expect(place.name).toBe('Bubeneč')
    expect(Option.getOrThrow(place.cityName)).toBe('Praha')
  })

  it('reports a place-tagged city boundary with its own type', async () => {
    // In Praha but outside any sub-city polygon and > 1.5 km from any node
    const place = await nearest(49.95, 14.25)
    expect(place.id).toBe(100n)
    expect(place.name).toBe('Praha')
    expect(place.placeType).toBe('city')
    expect(Option.isNone(place.cityName)).toBe(true)
  })

  it('falls back to the nearest sub-city node inside the covering city polygon', async () => {
    const place = await nearest(49.1, 13.1)
    expect(place.id).toBe(5n)
    expect(place.name).toBe('Downtown')
    expect(place.placeType).toBe('neighbourhood')
    expect(place.distanceMeters).toBe(0)
    // An untagged municipality can be a village — the city node is the context
    expect(Option.getOrThrow(place.cityName)).toBe('Cityville')
    expect(Option.getOrThrow(place.cityNames).en).toBe('Cityville (node)')
  })

  it('ignores sub-city nodes outside the city polygon even when they are nearer', async () => {
    // 0.005° from Outsider (outside Cityville), 0.1° from Downtown (inside,
    // but beyond the 1.5 km node radius) — the city itself is the label
    const place = await nearest(49.1, 13.195)
    expect(place.id).toBe(106n)
    expect(place.name).toBe('Cityville')
    expect(place.placeType).toBe('municipality')
    // Same-named city node as context; the address formatter collapses it
    expect(Option.getOrThrow(place.cityName)).toBe('Cityville')
  })

  it('gives a municipality boundary the nearest city/town node as context', async () => {
    const place = await nearest(49.35, 13.05)
    expect(place.id).toBe(108n)
    expect(place.name).toBe('Smallville')
    expect(place.placeType).toBe('municipality')
    expect(Option.getOrThrow(place.cityName)).toBe('Cityville')
  })

  it('gives a sub-city polygon without a city polygon the nearest city/town node context', async () => {
    const place = await nearest(51.05, 15.05)
    expect(place.id).toBe(105n)
    expect(place.name).toBe('Rural village')
    expect(place.placeType).toBe('village')
    // Farther city is within 30 km and cities outrank towns for context
    expect(Option.getOrThrow(place.cityName)).toBe('Farther city')
  })

  it('applies country-specific level roles (Norwegian kommune at level 7)', async () => {
    const place = await nearest(51.55, 13.55)
    expect(place.id).toBe(107n)
    expect(place.name).toBe('Kommune')
    expect(Option.getOrThrow(place.countryCode)).toBe('no')
    // No city/town node within 30 km — no context at all
    expect(Option.isNone(place.cityName)).toBe(true)
  })

  it('falls back to the nearest settlement node with city context outside all boundaries', async () => {
    const place = await nearest(52.5, 13.5)
    expect(place.id).toBe(7n)
    expect(place.name).toBe('Fallback village')
    expect(place.distanceMeters).toBeCloseTo(0, 0)
    expect(Option.getOrThrow(place.cityName)).toBe('Fallback town')
  })

  it('prefers the most important city/town within 30 km as context over the nearest', async () => {
    const place = await nearest(52.21, 14.02)
    expect(place.name).toBe('Between village')
    expect(Option.getOrThrow(place.cityName)).toBe('Metropolis')
  })

  it("prefers a city/town in the label's own country as context", async () => {
    const place = await nearest(52.3, 14.5)
    expect(place.name).toBe('Border village')
    expect(Option.getOrThrow(place.cityName)).toBe('Home town')
  })

  it('returns nothing when no settlement is within the distance cutoff', async () => {
    const result = await runtime.runPromise(
      Effect.flatMap(GeocodingDbService, (db) =>
        db.nearestPlace({latitude: 0, longitude: 0, maxDistanceMeters: 50_000})
      )
    )
    expect(Option.isNone(result)).toBe(true)
  })
})
