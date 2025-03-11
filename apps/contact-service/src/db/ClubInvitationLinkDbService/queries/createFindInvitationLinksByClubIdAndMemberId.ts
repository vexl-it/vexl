import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubMemberRecordId} from '../../ClubMemberDbService/domain'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubInvitationLinkRecord} from '../domain'

export const FindInvitationLinkByClubIdAndMemberIdParams = Schema.Struct({
  clubId: ClubRecordId,
  memberId: ClubMemberRecordId,
})
export type FindInvitationLinkByClubIdAndMemberIdParams =
  typeof FindInvitationLinkByClubIdAndMemberIdParams.Type

export const createFindInvitationLinkByClubIdAndMemberId = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindInvitationLinkByClubIdAndMemberIdParams,
      Result: ClubInvitationLinkRecord,
      execute: (params) => sql`
        SELECT
          *
        FROM
          club_invitation_link
        WHERE
          club_id = ${params.clubId}
          AND created_by_member_id = ${params.memberId}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findInvitationLinkByClubIdAndMemberId query',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findInvitationLinkByClubIdAndMemberId query')
    )
  }
)
