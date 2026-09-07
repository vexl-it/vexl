import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const UpdateReactivateClubParams = Schema.Struct({
  clubUuid: ClubUuid,
})
export type UpdateReactivateClubParams = typeof UpdateReactivateClubParams.Type

export const createUpdateReactivateClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: UpdateReactivateClubParams,
    Result: ClubDbRecord,
    execute: ({clubUuid}) => sql`
      UPDATE club
      SET
        made_inactive_at = NULL,
        made_inactive_reason = NULL
      WHERE
        UUID = ${clubUuid}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in updateReactivateClub query'),
    Effect.withSpan('updateReactivateClub query')
  )
})
