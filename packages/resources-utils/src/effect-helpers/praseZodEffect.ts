import {Effect} from 'effect'
import {type ZodType, type z} from 'zod'
import {type ZodParseError} from './../utils/parsing'

export default function parseZodEffect<T extends ZodType>(
  zodType: T
): (
  unknownData: unknown
) => Effect.Effect<z.TypeOf<T>, ZodParseError<z.TypeOf<T>>, never> {
  return (unkownData) => {
    return Effect.sync(() => zodType.safeParse(unkownData)).pipe(
      Effect.flatMap((result) => {
        if (result.success) {
          return Effect.succeed(result.data)
        }
        return Effect.fail({
          _tag: 'ZodParseError',
          error: new Error(result.error.message),
          zodError: result.error,
          originalData: unkownData,
        } satisfies ZodParseError<z.TypeOf<T>>)
      })
    )
  }
}
