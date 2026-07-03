import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'

export const createDeleteExpiredNotes = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  return () =>
    sql`
      DELETE FROM note_public
      WHERE
        expires_at < now()
    `.pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error deleting expired notes', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
})
