import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {ClubInvitationLinkRecord} from '../domain'

export const InsertClubInvitationLinkParams = Schema.Struct({
  ...objectCopyAndOmit(ClubInvitationLinkRecord.fields, 'id'),
})
export type InsertClubInvitationLinkParams =
  typeof InsertClubInvitationLinkParams.Type

export const createInsertInvitationLink = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: InsertClubInvitationLinkParams,
    Result: ClubInvitationLinkRecord,
    execute: (params) => sql`
      INSERT INTO
        club_invitation_link ${sql.insert(params)}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertClubInvitationLink query'),
    Effect.withSpan('insertClubInvitationLink query')
  )
})
