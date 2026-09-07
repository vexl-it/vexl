import {Schema} from 'effect'
import {Base64} from 'js-base64'

export const Base64String = Schema.String.pipe(
  Schema.check(Schema.makeFilter(Base64.isValid))
)
export type Base64String = typeof Base64String.Type
