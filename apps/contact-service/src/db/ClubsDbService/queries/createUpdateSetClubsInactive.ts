import {PgClient} from '@effect/sql-pg'
import {ClubMadeInactiveReason} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const UpdateSetClubsInactiveParams = Schema.Struct({
  id: Schema.Array(ClubRecordId),
  reason: ClubMadeInactiveReason,
})
export type UpdateSetClubsInactiveParams =
  typeof UpdateSetClubsInactiveParams.Type

export const createUpdateSetClubsInactive = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: UpdateSetClubsInactiveParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      UPDATE club
      SET
        made_inactive_at = now(),
        made_inactive_reason = ${params.reason}
      WHERE
        ${sql.in('id', params.id)}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in updateSetClubsInactive query'),
    Effect.withSpan('updateSetClubsInactive query')
  )
})
