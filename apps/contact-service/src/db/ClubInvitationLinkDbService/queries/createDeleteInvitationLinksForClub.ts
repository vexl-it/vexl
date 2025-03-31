import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteClubInvitationLinksForClubParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type DeleteClubInvitationLinksForClubParams =
  typeof DeleteClubInvitationLinksForClubParams.Type

export const createDeleteInvitationLinksForClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteClubInvitationLinksForClubParams,
    execute: (params) => sql`
      DELETE FROM club_invitation_link
      WHERE
        club_id = ${params.clubId}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteInvitationLinksForClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteInvitationLinksForClub query')
  )
})
