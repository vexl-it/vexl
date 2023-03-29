import {z} from 'zod'
import {DateTime} from 'luxon'

export const IsoDatetimeString = z
  .custom<string>((isoString) => DateTime.fromISO(String(isoString)).isValid)
  .brand<'IsoDatetimeString'>()

export type IsoDatetimeString = z.TypeOf<typeof IsoDatetimeString>
