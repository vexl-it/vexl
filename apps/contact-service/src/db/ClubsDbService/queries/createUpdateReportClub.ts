import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const UpdateReportClubRequest = Schema.Struct({
  clubUuid: ClubUuid,
})
export type UpdateReportClubRequest = typeof UpdateReportClubRequest.Type

export const createUpdateReportClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
    UnexpectedServerError.wrapErrors('Error updaing report club'),
    Effect.withSpan('updateReportClub query')
  )
})
