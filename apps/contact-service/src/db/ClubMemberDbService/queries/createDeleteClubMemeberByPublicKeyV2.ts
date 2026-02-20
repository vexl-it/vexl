import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteClubMemberByPublicKeyV2Params = Schema.Struct({
  clubId: ClubRecordId,
  publicKeyV2: PublicKeyV2,
})
export type DeleteClubMemberByPublicKeyV2Params =
  typeof DeleteClubMemberByPublicKeyV2Params.Type

export const createDeleteClubMemeberByPublicKeyV2 = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteClubMemberByPublicKeyV2Params,
    execute: (params) => sql`
      DELETE FROM club_member
      WHERE
        club_id = ${params.clubId}
        AND public_key_v2 = ${params.publicKeyV2}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteClubMemeberByPublicKeyV2 query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteClubMemeberByPublicKeyV2 query')
  )
})
