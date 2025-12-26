import {Schema} from 'effect'

export const HashedPhoneNumber = Schema.String.pipe(
  Schema.brand('HashedPhoneNumber')
)
export type HashedPhoneNumber = typeof HashedPhoneNumber.Type
