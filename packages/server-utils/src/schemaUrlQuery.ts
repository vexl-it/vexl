import {HttpServerRequest} from '@effect/platform'
import {Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {type ParseOptions} from 'effect/SchemaAST'

export class UrlParamsError extends Schema.TaggedError<UrlParamsError>(
  'UrlParamsError'
)('UrlParamsError', {message: Schema.String}) {}

export const schemaUrlSearchParams = <
  R,
  I extends Readonly<Record<string, string>>,
  A,
>(
  schema: Schema.Schema<A, I, R>,
  options?: ParseOptions | undefined
): Effect.Effect<
  A,
  ParseError | UrlParamsError,
  R | HttpServerRequest.HttpServerRequest
> => {
  const parse = Schema.decodeUnknown(schema, options)
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
