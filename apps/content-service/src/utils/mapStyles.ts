import {type HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {
  MapStyleJson,
  type MapStylesResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import axios from 'axios'
import {Context, Effect, Layer, pipe, Schema} from 'effect'
import {darkMapStyleUrlConfig, lightMapStyleUrlConfig} from '../configs'

const MAP_STYLE_FETCH_TIMEOUT_MS = 10_000
type MapStyleVariant = 'light' | 'dark'

class SanitizedMapStyleError extends Schema.TaggedError<SanitizedMapStyleError>(
  'SanitizedMapStyleError'
)('SanitizedMapStyleError', {
  styleVariant: Schema.Literals(['light', 'dark']),
  errorType: Schema.Literals(['AxiosError', 'UnexpectedError', 'SchemaError']),
  message: Schema.String,
  httpStatus: Schema.optional(Schema.Number),
}) {}

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
  url: HttpsUrlString,
  styleVariant: MapStyleVariant
): Effect.Effect<MapStyleJson, MapStyleFetchError | MapStyleValidationError> =>
  Effect.gen(function* () {
    const response = yield* pipe(
      Effect.tryPromise(
        async () => await axios.get(url, {timeout: MAP_STYLE_FETCH_TIMEOUT_MS})
      ),
      Effect.mapError((e) => {
        const isAxiosError = axios.isAxiosError(e)

        return new MapStyleFetchError({
          cause: new SanitizedMapStyleError({
            styleVariant,
            errorType: isAxiosError ? 'AxiosError' : 'UnexpectedError',
            message: 'Map style request failed',
            httpStatus: isAxiosError ? e.response?.status : undefined,
          }),
          message: `Failed to fetch ${styleVariant} map style`,
        })
      })
    )
    // Validate the shape only — decoding a Struct strips excess properties,
    // so the full original document is what gets stringified.
    return yield* pipe(
      Schema.decodeUnknownEffect(MapStyleShape)(response.data),
      Effect.andThen(
        Schema.decodeEffect(MapStyleJson)(JSON.stringify(response.data))
      ),
      Effect.mapError(
        () =>
          new MapStyleValidationError({
            cause: new SanitizedMapStyleError({
              styleVariant,
              errorType: 'SchemaError',
              message: 'Map style response failed validation',
            }),
            message: `Fetched ${styleVariant} map style is not a valid style document`,
          })
      )
    )
  })

export class MapStylesService extends Context.Service<
  MapStylesService,
  MapStylesOperations
>()('MapStylesService') {
  static readonly Live = Layer.effect(
    MapStylesService,
    Effect.gen(function* () {
      const lightUrl = yield* lightMapStyleUrlConfig
      const darkUrl = yield* darkMapStyleUrlConfig

      return {
        fetchMapStyles: () =>
          Effect.all(
            {
              light: fetchStyleJson(lightUrl, 'light'),
              dark: fetchStyleJson(darkUrl, 'dark'),
            },
            {concurrency: 'unbounded'}
          ),
      } satisfies MapStylesOperations
    })
  )
}
