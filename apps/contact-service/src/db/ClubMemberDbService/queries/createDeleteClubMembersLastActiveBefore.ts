import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteClubMembersLastActiveBeforeParams = Schema.Struct({
  lastActiveBefore: Schema.DateFromSelf,
})
export type DeleteClubMembersLastActiveBeforeParams =
  typeof DeleteClubMembersLastActiveBeforeParams.Type

export const DeletedClubMember = Schema.Struct({
  clubId: ClubRecordId,
})
export type DeletedClubMember = typeof DeletedClubMember.Type

export const createDeleteClubMembersLastActiveBefore = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: DeleteClubMembersLastActiveBeforeParams,
      Result: DeletedClubMember,
      execute: (params) => sql`
        DELETE FROM club_member
        WHERE
          last_refreshed_at < ${params.lastActiveBefore}
        RETURNING
          club_id
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in deleteClubMemebersLastActiveBefore query'
      ),
      Effect.withSpan('deleteClubMemebersLastActiveBefore query')
    )
  }
)
