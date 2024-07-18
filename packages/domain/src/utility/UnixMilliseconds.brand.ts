import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {type DateTime} from 'luxon'
import {z} from 'zod'

export const UnixMillisecondsE = Schema.Number.pipe(
  Schema.int(),
  Schema.greaterThanOrEqualTo(0),
  Schema.brand('UnixMilliseconds')
)

export const UnixMilliseconds = z
  .number()
  .int()
  .min(0)
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'UnixMilliseconds'>>()(v)
  )

export type UnixMilliseconds = Schema.Schema.Type<typeof UnixMillisecondsE>

export function now(): UnixMilliseconds {
  return UnixMilliseconds.parse(Date.now())
}

export function unixMillisecondsNow(): UnixMilliseconds {
  return now()
}

export function unixMillisecondsFromNow(
  milliseconds: number
): UnixMilliseconds {
  return UnixMilliseconds.parse(Date.now() + milliseconds)
}

export function unixMilliseconds(): UnixMilliseconds {
  return now()
}

export const UnixMilliseconds0 = UnixMilliseconds.parse(0)

export function fromDateTime(dateTime: DateTime): UnixMilliseconds {
  return UnixMilliseconds.parse(dateTime.valueOf())
}
