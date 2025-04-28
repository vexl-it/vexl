import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'

export const createDeleteClubReportedRecordByReportedAtBefore = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    return (deleteOlderThanDays: number) =>
      sql`
        DELETE FROM club_reported_record
        WHERE
          reported_at < (
            now() - interval '1 DAY' * ${deleteOlderThanDays}
          )::date
      `.pipe(
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.logError(
              'Error deleting entry for club by reported at before',
              e
            ),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        )
      )
  }
)
