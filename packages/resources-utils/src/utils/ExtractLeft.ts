import {type Effect} from 'effect'
import type * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'

export type ExtractLeftTE<T extends TE.TaskEither<any, any>> =
  T extends TE.TaskEither<infer L, unknown> ? L : never

export type ExtractLeftE<T extends E.Either<any, any>> =
  T extends E.Either<infer L, unknown> ? L : never

export type ExtractRightFromEffect<T extends Effect.Effect<any, any>> =
  T extends Effect.Effect<unknown, infer R> ? R : never

export default {}
