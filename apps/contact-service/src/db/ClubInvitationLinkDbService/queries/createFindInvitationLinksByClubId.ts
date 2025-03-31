import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubInvitationLinkRecord} from '../domain'

export const FindInvitationLinkByClubIdParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type FindInvitationLinkByClubIdParams =
  typeof FindInvitationLinkByClubIdParams.Type

export const createFindInvitationLinkByClubId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: FindInvitationLinkByClubIdParams,
    Result: ClubInvitationLinkRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_invitation_link
      WHERE
        club_id = ${params.clubId}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findInvitationLinkByClubId query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findInvitationLinkByClubId query')
  )
})
