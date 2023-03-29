import {flow} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import {type TypeOf, type ZodError, type ZodType} from 'zod'

export interface ZodParseError<T> {
  readonly _tag: 'ParseError'
  readonly error: ZodError<T>
  readonly originalData: unknown
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
          _tag: 'ParseError',
          error: result.error,
          originalData: JSON.stringify(v),
        })
      }
      return E.right(result.data)
    })
  )
}

export interface JsonParseError {
  readonly _tag: 'jsonParseError'
  readonly error: unknown
}
export function parseJson(json: string): E.Either<JsonParseError, any> {
  return E.tryCatch(
    () => JSON.parse(json),
    (e) => ({_tag: 'jsonParseError', error: e})
  )
}
export interface JsonStringifyError {
  readonly _tag: 'jsonError'
  readonly e: unknown
}

export function stringifyToJson(
  data: unknown
): E.Either<JsonStringifyError, string> {
  return E.tryCatch(
    () => JSON.stringify(data),
    (e) => ({_tag: 'jsonError', e} as const)
  )
}
