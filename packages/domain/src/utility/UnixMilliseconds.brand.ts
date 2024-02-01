import {type DateTime} from 'luxon'
import {z} from 'zod'

export const UnixMilliseconds = z
  .number()
  .int()
  .min(0)
  .brand<'UnixMilliseconds'>()
export type UnixMilliseconds = z.TypeOf<typeof UnixMilliseconds>

export function now(): UnixMilliseconds {
  return UnixMilliseconds.parse(Date.now())
}

export function unixMillisecondsNow(): UnixMilliseconds {
  return now()
}

export function unixMilliseconds(): UnixMilliseconds {
  return now()
}

export const UnixMilliseconds0 = UnixMilliseconds.parse(0)

export function fromDateTime(dateTime: DateTime): UnixMilliseconds {
  return UnixMilliseconds.parse(dateTime.valueOf())
}
