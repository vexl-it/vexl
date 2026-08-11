import {PgClient} from '@effect/sql-pg'
import {Array, Effect, pipe} from 'effect'
import {computeImportance, normalizeName} from '../../places/common'

interface SeedPlace {
  id: number
  placeType: string
  name: string
  names: Record<string, string>
  countryCode: string
  population: number | undefined
  latitude: number
  longitude: number
}

export const seedPlaces: readonly SeedPlace[] = [
  {
    id: 1,
    placeType: 'city',
    name: 'Bratislava',
    names: {de: 'Pressburg', ja: 'ブラチスラヴァ', cs: 'Bratislava'},
    countryCode: 'sk',
    population: 475_503,
    latitude: 48.1486,
    longitude: 17.1077,
  },
  {
    id: 2,
    placeType: 'city',
    name: 'Praha',
    names: {en: 'Prague', de: 'Prag'},
    countryCode: 'cz',
    population: 1_384_732,
    latitude: 50.0875,
    longitude: 14.4213,
  },
  {
    id: 3,
    placeType: 'neighbourhood',
    name: 'Vinohrady',
    names: {},
    countryCode: 'cz',
    population: undefined,
    latitude: 50.0755,
    longitude: 14.4378,
  },
  {
    id: 4,
    placeType: 'street',
    name: 'Obchodná',
    names: {},
    countryCode: 'sk',
    population: undefined,
    latitude: 48.1454,
    longitude: 17.1123,
  },
  {
    id: 5,
    placeType: 'cafe',
    name: 'Urban House',
    names: {},
    countryCode: 'sk',
    population: undefined,
    latitude: 48.1443,
    longitude: 17.1108,
  },
  // Second segment of the same street one ingest grid cell away — suggest
  // must collapse it into the entry above
  {
    id: 6,
    placeType: 'street',
    name: 'Obchodná',
    names: {},
    countryCode: 'sk',
    population: undefined,
    latitude: 48.19,
    longitude: 17.16,
  },
  // Two distinct same-named towns far apart — suggest must keep both
  {
    id: 7,
    placeType: 'town',
    name: 'Springfield',
    names: {},
    countryCode: 'us',
    population: 114_394,
    latitude: 39.799,
    longitude: -89.644,
  },
  {
    id: 8,
    placeType: 'town',
    name: 'Springfield',
    names: {},
    countryCode: 'us',
    population: 155_929,
    latitude: 42.1015,
    longitude: -72.5898,
  },
  {
    id: 9,
    placeType: 'city',
    name: 'Łódź',
    names: {},
    countryCode: 'pl',
    population: 670_642,
    latitude: 51.7769,
    longitude: 19.4547,
  },
]

export const seedPlacesInDb = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  yield* _(sql`DELETE FROM places`)

  for (const place of seedPlaces) {
    const importance = computeImportance(place.placeType, place.population)
    yield* _(sql`
      INSERT INTO
        places ${sql.insert({
        id: place.id,
        placeType: place.placeType,
        name: place.name,
        names: sql.json(place.names),
        countryCode: place.countryCode,
        population: place.population ?? null,
        importance,
        latitude: place.latitude,
        longitude: place.longitude,
      })}
    `)

    const normNames = pipe(
      [place.name, ...Object.values(place.names)],
      Array.map(normalizeName),
      Array.dedupe
    )
    for (const normName of normNames) {
      yield* _(sql`
        INSERT INTO
          place_names ${sql.insert({
          placeId: place.id,
          normName,
          importance,
        })}
      `)
    }
  }
})
