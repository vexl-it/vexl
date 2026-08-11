import {type HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {
  MapStyleJson,
  type MapStylesResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import axios from 'axios'
import {Context, Effect, Layer, Schema} from 'effect'
import {darkMapStyleUrlConfig, lightMapStyleUrlConfig} from '../configs'

const MAP_STYLE_FETCH_TIMEOUT_MS = 10_000

export class MapStyleFetchError extends Schema.TaggedError<MapStyleFetchError>(
  'MapStyleFetchError'
)('MapStyleFetchError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export class MapStyleValidationError extends Schema.TaggedError<MapStyleValidationError>(
  'MapStyleValidationError'
)('MapStyleValidationError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export interface MapStylesOperations {
  fetchMapStyles: () => Effect.Effect<
    MapStylesResponse,
    MapStyleFetchError | MapStyleValidationError
  >
}

const MapStyleShape = Schema.Struct({
  version: Schema.Number,
  layers: Schema.Array(Schema.Unknown),
})

const fetchStyleJson = (
  url: HttpsUrlString
): Effect.Effect<MapStyleJson, MapStyleFetchError | MapStyleValidationError> =>
  Effect.gen(function* (_) {
    const response = yield* _(
      Effect.tryPromise(
        async () => await axios.get(url, {timeout: MAP_STYLE_FETCH_TIMEOUT_MS})
      ),
      Effect.mapError(
        (e) =>
          new MapStyleFetchError({
            cause: e,
            message: `Failed to fetch map style from ${url}`,
          })
      )
    )
    // Validate the shape only — decoding a Struct strips excess properties,
    // so the full original document is what gets stringified.
    return yield* _(
      Schema.decodeUnknown(MapStyleShape)(response.data),
      Effect.zipRight(
        Schema.decode(MapStyleJson)(JSON.stringify(response.data))
      ),
      Effect.mapError(
        (e) =>
          new MapStyleValidationError({
            cause: e,
            message: `Fetched map style from ${url} is not a valid style document`,
          })
      )
    )
  })

export class MapStylesService extends Context.Tag('MapStylesService')<
  MapStylesService,
  MapStylesOperations
>() {
  static readonly Live = Layer.effect(
    MapStylesService,
    Effect.gen(function* (_) {
      const lightUrl = yield* _(lightMapStyleUrlConfig)
      const darkUrl = yield* _(darkMapStyleUrlConfig)

      return {
        fetchMapStyles: () =>
          Effect.all(
            {
              light: fetchStyleJson(lightUrl),
              dark: fetchStyleJson(darkUrl),
            },
            {concurrency: 'unbounded'}
          ),
      } satisfies MapStylesOperations
    })
  )
}
