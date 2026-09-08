import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubInvitationLinkRecord} from '../domain'

export const InsertClubInvitationLinkParams = Schema.Struct({
  ...objectCopyAndOmit(ClubInvitationLinkRecord.fields, 'id'),
})
export type InsertClubInvitationLinkParams =
  typeof InsertClubInvitationLinkParams.Type

export const createInsertInvitationLink = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
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
