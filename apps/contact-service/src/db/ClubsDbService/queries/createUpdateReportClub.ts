import {PgClient} from '@effect/sql-pg'
import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, Schema} from 'effect'

export const UpdateReportClubRequest = Schema.Struct({
  clubUuid: ClubUuidE,
})
export type UpdateReportClubRequest = typeof UpdateReportClubRequest.Type

export const createUpdateReportClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  return (club: UpdateReportClubRequest) =>
    sql`
      UPDATE club
      SET
        report = report + 1
      WHERE
        ${sql.and([sql`UUID = ${club.clubUuid}`, sql`valid_until <= now()`])}
    `.pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error updaing report club', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
})
