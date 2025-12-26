import {Schema} from 'effect/index'

export const PathString = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand('PathString')
)
export type PathString = typeof PathString.Type
