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
    `.pipe(UnexpectedServerError.wrapErrors('Error deleting expired notes'))
})
