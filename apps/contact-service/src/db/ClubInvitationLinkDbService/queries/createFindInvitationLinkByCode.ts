import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubInvitationLinkRecord} from '../domain'

export const FindInvitationLinkbyCodeParams = Schema.Struct({
  code: Schema.String,
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findInvitationLinkByCode query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findInvitationLinkByCode query')
  )
})
