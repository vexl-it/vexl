import {Effect, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {type ParseOptions} from 'effect/SchemaAST'
import {HttpServerRequest} from 'effect/unstable/http'

export class UrlParamsError extends Schema.TaggedError<UrlParamsError>(
  'UrlParamsError'
)('UrlParamsError', {message: Schema.String}) {}

export const schemaUrlSearchParams = <
  R,
  I extends Readonly<Record<string, string>>,
  A,
>(
  schema: Schema.Codec<A, I, R, R>,
  options?: ParseOptions | undefined
): Effect.Effect<
  A,
  SchemaError | UrlParamsError,
  R | HttpServerRequest.HttpServerRequest
> => {
  const parse = Schema.decodeUnknownEffect(schema, options)
  return HttpServerRequest.HttpServerRequest.pipe(
    Effect.flatMap((req) =>
      Effect.try({
        try: () => {
          const urlParams = req.url.replace(/^.+?\?/, '')
          return Object.fromEntries(new URLSearchParams(urlParams))
        },
        catch: () => new UrlParamsError({message: 'Error processing url'}),
      })
    ),
    Effect.flatMap(parse)
  )
}
