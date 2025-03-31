import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteAllClubMemberParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type DeleteAllClubMemberParams = typeof DeleteAllClubMemberParams.Type

export const createDeleteAllClubMemebers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteAllClubMemberParams,
    execute: (params) => sql`
      DELETE FROM club_member
      WHERE
        club_id = ${params.clubId}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteAllClubMembers query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteAllClubMembers query')
  )
})
