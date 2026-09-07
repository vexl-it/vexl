import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubInvitationLinkRecordId} from '../domain'

export const DeleteClubInvivationLinkParams = Schema.Struct({
  id: ClubInvitationLinkRecordId,
})
export type DeleteClubInvivationLinkParams =
  typeof DeleteClubInvivationLinkParams.Type

export const createDeleteInvitationLink = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: DeleteClubInvivationLinkParams,
    execute: (params) => sql`
      DELETE FROM club_invitation_link
      WHERE
        id = ${params.id}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteInvitationLink query'),
    Effect.withSpan('deleteInvitationLink query')
  )
})
