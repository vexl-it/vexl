import {Schema} from 'effect'
import {DateTime} from 'luxon'
import {type UnixMilliseconds} from './UnixMilliseconds.brand'

export const IsoDatetimeString = Schema.String.pipe(
  Schema.filter((isoString) => DateTime.fromISO(String(isoString)).isValid),
  Schema.brand('IsoDatetimeString')
)
export type IsoDatetimeString = Schema.Schema.Type<typeof IsoDatetimeString>
export const MINIMAL_DATE = Schema.decodeSync(IsoDatetimeString)(
  '1970-01-01T00:00:00.000Z'
)

export function fromMilliseconds(
  milliseconds: UnixMilliseconds
): IsoDatetimeString {
  // ?? '' - this is here to make TS happy, DateTime.toISO can return null but
  // in this case it won't because we are passing valid milliseconds always
  return Schema.decodeSync(IsoDatetimeString)(
    DateTime.fromMillis(milliseconds).toISO() ?? ''
  )
}

export function isoNow(): IsoDatetimeString {
  return Schema.decodeSync(IsoDatetimeString)(DateTime.now().toISO())
}

export function fromJsDate(date: Date): IsoDatetimeString {
  return Schema.decodeUnknownSync(IsoDatetimeString)(
    DateTime.fromJSDate(date).toISO()
  )
}
