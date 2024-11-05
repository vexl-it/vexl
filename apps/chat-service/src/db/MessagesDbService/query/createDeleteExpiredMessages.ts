import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, pipe} from 'effect'

export const createDeleteExpiredMessages = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = sql`
    DELETE FROM message
    WHERE
      expires_at <= NOW()
  `

  return () =>
    pipe(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deleteExpiredMessages', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteExpiredMessages find')
    )
})
