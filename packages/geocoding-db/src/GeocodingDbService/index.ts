import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type GeocodingRecordId, type GeocodingRecordWithContext} from './domain'
import {
  createQueryNearestPlace,
  type NearestGeocodingRecord,
} from './queries/createQueryNearestPlace'
import {createQueryPlaceById} from './queries/createQueryPlaceById'
import {createQuerySuggestPlaces} from './queries/createQuerySuggestPlaces'

export interface GeocodingDbOperations {
  suggestPlaces: (args: {
    normPhrase: string
    simPhrase: string
    minImportance: number
    usePrefix: boolean
    useTrigram: boolean
    limit: number
  }) => Effect.Effect<
    readonly GeocodingRecordWithContext[],
    UnexpectedServerError
  >
  nearestPlace: (args: {
    latitude: number
    longitude: number
    maxDistanceMeters: number
  }) => Effect.Effect<
    Option.Option<NearestGeocodingRecord>,
    UnexpectedServerError
  >
  placeById: (
    id: GeocodingRecordId
  ) => Effect.Effect<
    Option.Option<GeocodingRecordWithContext>,
    UnexpectedServerError
  >
}

export class GeocodingDbService extends Context.Tag('GeocodingDbService')<
  GeocodingDbService,
  GeocodingDbOperations
>() {
  static readonly Live = Layer.effect(
    GeocodingDbService,
    Effect.gen(function* (_) {
      const suggestPlaces = yield* _(createQuerySuggestPlaces)
      const nearestPlace = yield* _(createQueryNearestPlace)
      const queryPlaceById = yield* _(createQueryPlaceById)

      return {
        suggestPlaces,
        nearestPlace,
        placeById: (id) => queryPlaceById({id}),
      }
    })
  )
}
