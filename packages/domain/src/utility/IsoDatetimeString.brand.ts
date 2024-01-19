import {DateTime} from 'luxon'
import {z} from 'zod'

export const IsoDatetimeString = z
  .custom<string>((isoString) => DateTime.fromISO(String(isoString)).isValid)
  .brand<'IsoDatetimeString'>()

export type IsoDatetimeString = z.TypeOf<typeof IsoDatetimeString>
export const MINIMAL_DATE = IsoDatetimeString.parse('1970-01-01T00:00:00.000Z')

export function isoNow(): IsoDatetimeString {
  return IsoDatetimeString.parse(DateTime.now().toISO())
}
