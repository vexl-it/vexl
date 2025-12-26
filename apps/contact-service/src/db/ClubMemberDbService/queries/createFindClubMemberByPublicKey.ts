import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubMemberRecord} from '../domain'

export const FindClubMemberByPublicKeyParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
})
export type FindClubMemberByPublicKeyParams =
  typeof FindClubMemberByPublicKeyParams.Type

export const createFindClubMemeberByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindClubMemberByPublicKeyParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_member
      WHERE
        public_key = ${params.publicKey}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findClubMemeberByPublicKey query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findClubMemeberByPublicKey query')
  )
})
