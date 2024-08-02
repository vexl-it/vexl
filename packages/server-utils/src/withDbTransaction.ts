import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export class TransactionError extends Schema.TaggedError<TransactionError>(
  'TransactionError'
)('TransactionError', {
  cause: Schema.Unknown,
}) {}

export const withDbTransaction = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R, E | TransactionError, A | SqlClient.SqlClient> =>
  Effect.flatMap(SqlClient.SqlClient, (c) =>
    c
      .withTransaction(
        effect.pipe(
          Effect.catchAll((e) => Effect.fail({_tag: 'InnerError' as const, e}))
        )
      )
      .pipe(
        Effect.catchTag('SqlError', (e) =>
          Effect.fail(new TransactionError({cause: e}))
        ),
        Effect.catchTag('InnerError', (e) => Effect.fail(e.e))
      )
  )
