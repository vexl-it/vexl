import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubMemberRecordId} from '../domain'

export const UpdateClubMemberPublicKeyV2Params = Schema.Struct({
  clubMemberId: ClubMemberRecordId,
  publicKeyV2: PublicKeyV2,
})
export type UpdateClubMemberPublicKeyV2Params =
  typeof UpdateClubMemberPublicKeyV2Params.Type

export const createUpdateClubMemberPublicKeyV2 = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateClubMemberPublicKeyV2Params,
    execute: (params) => sql`
      UPDATE club_member
      SET
        public_key_v2 = ${params.publicKeyV2}
      WHERE
        id = ${params.clubMemberId}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateClubMemberPublicKeyV2', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateClubMemberPublicKeyV2 query')
  )
})
