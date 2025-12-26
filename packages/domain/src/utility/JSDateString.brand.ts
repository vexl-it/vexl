import {Schema} from 'effect'
import {DateTime} from 'luxon'

export const JSDateString = Schema.String.pipe(
  Schema.filter(
    (jsDateString) => DateTime.fromJSDate(new Date(jsDateString)).isValid
  ),
  Schema.brand('JSDateString')
)
export type JSDateString = typeof JSDateString.Type
