import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubInvitationLinkRecordId} from '../domain'

export const DeleteClubInvivationLinkParams = Schema.Struct({
  id: ClubInvitationLinkRecordId,
})
export type DeleteClubInvivationLinkParams =
  typeof DeleteClubInvivationLinkParams.Type

export const createDeleteInvitationLink = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteClubInvivationLinkParams,
    execute: (params) => sql`
      DELETE FROM club_invitation_link
      WHERE
        club_id = ${params.id}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteInvitationLink query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteInvitationLink query')
  )
})
