import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {DateTime} from 'luxon'
import {z} from 'zod'

export const JSDateString = z
  .custom<string>(
    (jsDateString) =>
      DateTime.fromJSDate(new Date(String(jsDateString))).isValid
  )
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'JSDateString'>>()(v)
  })

export const JSDateStringE = Schema.String.pipe(
  Schema.filter(
    (jsDateString) => DateTime.fromJSDate(new Date(jsDateString)).isValid
  ),
  Schema.brand('JSDateString')
)

export type JSDateString = Schema.Schema.Type<typeof JSDateStringE>
export const MINIMAL_JS_DATE = JSDateString.parse('1970-01-01')

export function isoNow(): JSDateString {
  return JSDateString.parse(DateTime.now().toJSDate())
}
