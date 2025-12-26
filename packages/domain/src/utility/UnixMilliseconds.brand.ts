import dayjs from 'dayjs'
import {Schema} from 'effect'
import {DateTime} from 'luxon'

export const UnixMilliseconds = Schema.Number.pipe(
  Schema.int(),
  Schema.greaterThanOrEqualTo(0),
  Schema.brand('UnixMilliseconds')
)
export type UnixMilliseconds = Schema.Schema.Type<typeof UnixMilliseconds>

export function now(): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(Date.now())
}

export function unixMillisecondsNow(): UnixMilliseconds {
  return now()
}

export function unixMillisecondsFromNow(
  milliseconds: number
): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(Date.now() + milliseconds)
}

export function unixMilliseconds(): UnixMilliseconds {
  return now()
}

export const UnixMilliseconds0 = Schema.decodeSync(UnixMilliseconds)(0)

export function fromDateTime(dateTime: DateTime): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(dateTime.valueOf())
}

export function getNextMidnightOnSelectedDate(date: Date): UnixMilliseconds {
  return Schema.decodeSync(UnixMilliseconds)(
    DateTime.fromJSDate(date).endOf('day').toMillis()
  )
}

/**
 * @deprecated Use localizedDateTimeActionAtom instead
 */
export const unixMillisecondsToPretty =
  (unixMilliseconds: UnixMilliseconds) =>
  (template?: string): string => {
    console.log(`Template: ${template}`)
    return dayjs(unixMilliseconds).format(template ?? 'MMM D, YYYY')
  }
