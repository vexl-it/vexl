import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Effect} from 'effect'
import * as E from 'fp-ts/Either'
import {flow} from 'fp-ts/function'
import {type TypeOf, type ZodError, type ZodType} from 'zod'

export interface ZodParseError<T> extends BasicError<'ZodParseError'> {
  zodError: ZodError<T>
  originalData: unknown
}

export function safeParse<T extends ZodType>(
  zodType: T
): (a: unknown) => E.Either<ZodParseError<TypeOf<T>>, TypeOf<T>> {
  return flow(
    E.of,
    E.chainW((v) => {
      const result = zodType.safeParse(v)
      if (!result.success) {
        return E.left<ZodParseError<T>>({
          _tag: 'ZodParseError',
          error: new Error(result.error.message),
          zodError: result.error,
          originalData: JSON.stringify(v),
        })
      }
      return E.right(result.data)
    })
  )
}

export type JsonParseError = BasicError<'JsonParseError'>

export function parseJson(json: string): E.Either<JsonParseError, any> {
  return E.tryCatch(() => JSON.parse(json), toError('JsonParseError'))
}

export type JsonStringifyError = BasicError<'JsonStringifyError'>

export function stringifyToJson(
  data: unknown
): E.Either<JsonStringifyError, string> {
  return E.tryCatch(() => JSON.stringify(data), toError('JsonStringifyError'))
}

export function stringifyToPrettyJson(
  data: unknown
): E.Either<JsonStringifyError, string> {
  return E.tryCatch(
    () => JSON.stringify(data, null, 2),
    toError('JsonStringifyError')
  )
}

export function stringifyE(
  data: unknown,
  {pretty}: {pretty: boolean} | undefined = {pretty: false}
): Effect.Effect<string, JsonStringifyError> {
  return Effect.try({
    try: () => (pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)),
    catch: toError('JsonStringifyError'),
  })
}
