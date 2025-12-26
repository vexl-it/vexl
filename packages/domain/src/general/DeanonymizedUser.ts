import {Schema} from 'effect'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'

export const DeanonymizedUser = Schema.Struct({
  name: UserName,
  partialPhoneNumber: Schema.optional(Schema.String),
  fullPhoneNumber: Schema.optional(E164PhoneNumber),
})
export type DeanonymizedUser = typeof DeanonymizedUser.Type
