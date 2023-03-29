import {flow} from 'fp-ts/function'
import {type z} from 'zod'
import {
  safeParse,
  type ZodParseError,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'

export function splitAndParse<T extends z.ZodType>(
  zodType: T,
  separator: RegExp | string
): (a: string) => E.Either<ZodParseError<z.TypeOf<T>>, Array<z.TypeOf<T>>> {
  return flow(
    (value) => value.split(separator),
    A.map(safeParse(zodType)),
    A.sequence(E.Applicative)
  )
}
