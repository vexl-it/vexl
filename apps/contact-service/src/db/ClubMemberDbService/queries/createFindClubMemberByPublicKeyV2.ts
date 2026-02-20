import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubMemberRecord} from '../domain'

export const FindClubMemberByPublicKeyV2Params = Schema.Struct({
  publicKeyV2: PublicKeyV2,
})
export type FindClubMemberByPublicKeyV2Params =
  typeof FindClubMemberByPublicKeyV2Params.Type

export const createFindClubMemeberByPublicKeyV2 = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindClubMemberByPublicKeyV2Params,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_member
      WHERE
        public_key_v2 = ${params.publicKeyV2}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findClubMemeberByPublicKeyV2 query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findClubMemeberByPublicKeyV2 query')
  )
})
