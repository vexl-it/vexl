import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const UpdateReportClubRequest = Schema.Struct({
  clubUuid: ClubUuid,
})
export type UpdateReportClubRequest = typeof UpdateReportClubRequest.Type

export const createUpdateReportClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateReportClubRequest,
    execute: (params) => sql`
      UPDATE club
      SET
        report = report + 1
      WHERE
        UUID = ${params.clubUuid}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error updaing report club', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateReportClub query')
  )
})
