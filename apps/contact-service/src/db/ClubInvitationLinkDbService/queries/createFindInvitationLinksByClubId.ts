import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubInvitationLinkRecord} from '../domain'

export const FindInvitationLinkByClubIdParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type FindInvitationLinkByClubIdParams =
  typeof FindInvitationLinkByClubIdParams.Type

export const createFindInvitationLinkByClubId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
    UnexpectedServerError.wrapErrors(
      'Error in findInvitationLinkByClubId query'
    ),
    Effect.withSpan('findInvitationLinkByClubId query')
  )
})
