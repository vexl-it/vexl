import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Effect, Either, Schema} from 'effect'
import * as E from 'fp-ts/Either'

export type JsonParseError = BasicError<'JsonParseError'>

export function parseJson(json: string): E.Either<JsonParseError, any> {
  return E.tryCatch(() => JSON.parse(json), toError('JsonParseError'))
}

export class JsonStringifyError extends Schema.TaggedError<JsonStringifyError>(
  'JsonStringifyError'
)('JsonStringifyError', {
  cause: Schema.Unknown,
}) {}

export function stringifyToJson(
  data: unknown
): Either.Either<string, JsonStringifyError> {
  return Either.try({
    try: () => JSON.stringify(data),
    catch: (e) => new JsonStringifyError({cause: e}),
  })
}

export function stringifyE(
  data: unknown,
  {pretty}: {pretty: boolean} | undefined = {pretty: false}
): Effect.Effect<string, JsonStringifyError> {
  return Effect.try({
    try: () => (pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)),
    catch: (e) => new JsonStringifyError({cause: e}),
  })
}
