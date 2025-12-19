import {Data, Effect} from 'effect/index'

export class SendMessageTasksManagerError extends Data.TaggedError(
  'SendMessageTasksManagerError'
)<{cause: unknown; message: string}> {
  static wrapErrors = (
    message: string
  ): (<A, I, R>(
    effect: Effect.Effect<A, I, R>
  ) => Effect.Effect<A, SendMessageTasksManagerError, R>) =>
    Effect.catchAll(
      (e) =>
        new SendMessageTasksManagerError({
          cause: e,
          message,
        })
    )
}
