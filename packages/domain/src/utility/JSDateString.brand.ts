import {DateTime} from 'luxon'
import {z} from 'zod'

export const JSDateString = z
  .custom<string>(
    (jsDateString) =>
      DateTime.fromJSDate(new Date(String(jsDateString))).isValid
  )
  .brand<'JSDateString'>()

export type JSDateString = z.TypeOf<typeof JSDateString>
export const MINIMAL_JS_DATE = JSDateString.parse('1970-01-01')

export function isoNow(): JSDateString {
  return JSDateString.parse(DateTime.now().toJSDate())
}
