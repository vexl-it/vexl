import {Schema} from 'effect'

export const PathString = Schema.String.pipe(
  Schema.check(Schema.isMinLength(1)),
  Schema.brand('PathString')
)
export type PathString = typeof PathString.Type
