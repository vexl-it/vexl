import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type PlaceWithContextRecord} from './domain'
import {
  createQueryNearestPlace,
  type NearestPlaceRecord,
} from './queries/createQueryNearestPlace'
import {createQuerySuggestPlaces} from './queries/createQuerySuggestPlaces'

export interface PlacesDbOperations {
  suggestPlaces: (args: {
    normPhrase: string
    simPhrase: string
    minImportance: number
    usePrefix: boolean
    useTrigram: boolean
    limit: number
  }) => Effect.Effect<readonly PlaceWithContextRecord[], UnexpectedServerError>
  nearestPlace: (args: {
    latitude: number
    longitude: number
    maxDistanceMeters: number
  }) => Effect.Effect<Option.Option<NearestPlaceRecord>, UnexpectedServerError>
}

export class PlacesDbService extends Context.Tag('PlacesDbService')<
  PlacesDbService,
  PlacesDbOperations
>() {
  static readonly Live = Layer.effect(
    PlacesDbService,
    Effect.gen(function* (_) {
      const suggestPlaces = yield* _(createQuerySuggestPlaces)
      const nearestPlace = yield* _(createQueryNearestPlace)

      return {suggestPlaces, nearestPlace}
    })
  )
}
