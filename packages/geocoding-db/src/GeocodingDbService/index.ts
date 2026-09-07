import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type GeocodingRecordWithContext} from './domain'
import {
  createQueryNearestPlace,
  type NearestGeocodingRecord,
} from './queries/createQueryNearestPlace'
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
}

export class GeocodingDbService extends Context.Service<
  GeocodingDbService,
  GeocodingDbOperations
>()('GeocodingDbService') {
  static readonly Live = Layer.effect(
    GeocodingDbService,
    Effect.gen(function* () {
      const suggestPlaces = yield* createQuerySuggestPlaces
      const nearestPlace = yield* createQueryNearestPlace

      return {suggestPlaces, nearestPlace}
    })
  )
}
