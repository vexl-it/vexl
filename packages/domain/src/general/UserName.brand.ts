import {Schema} from 'effect'

export const UserName = Schema.Trim.pipe(
  Schema.check(Schema.isMinLength(1)),
  Schema.brand('UserName')
)
export type UserName = typeof UserName.Type
