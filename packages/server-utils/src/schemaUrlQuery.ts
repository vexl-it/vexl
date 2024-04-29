import {ServerRequest} from '@effect/platform/Http/ServerRequest'
import {Schema} from '@effect/schema'
import {type ParseOptions} from '@effect/schema/AST'
import {type ParseError} from '@effect/schema/ParseResult'
import {Effect} from 'effect'

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
): Effect.Effect<A, ParseError | UrlParamsError, R | ServerRequest> => {
  const parse = Schema.decodeUnknown(schema, options)
  return ServerRequest.pipe(
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
