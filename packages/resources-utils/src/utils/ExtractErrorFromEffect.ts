import {type Effect} from 'effect'

export type ExtractErrorFromEffect<T extends Effect.Effect<any, any>> =
  T extends Effect.Effect<unknown, infer R> ? R : never

export default {}
