import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteForClubParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type DeleteForClubParams = typeof DeleteForClubParams.Type

export const createDeleteForClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteForClubParams,
    execute: (params) => sql`
      DELETE FROM club_member_count_change
      WHERE
        club_id = ${params.clubId}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error in deleteClubMemberCountChangesForClub query'
    ),
    Effect.withSpan('deleteClubMemberCountChangesForClub query')
  )
})
