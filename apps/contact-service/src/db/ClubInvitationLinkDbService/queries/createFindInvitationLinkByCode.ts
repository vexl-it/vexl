import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubInvitationLinkRecord} from '../domain'

export const FindInvitationLinkbyCodeParams = Schema.Struct({
  code: ClubCode,
})
export type FindInvitationLinkbyCodeParams =
  typeof FindInvitationLinkbyCodeParams.Type

export const createFindInvitationLinkByCode = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindInvitationLinkbyCodeParams,
    Result: ClubInvitationLinkRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_invitation_link
      WHERE
        code = ${params.code}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findInvitationLinkByCode query'),
    Effect.withSpan('findInvitationLinkByCode query')
  )
})
