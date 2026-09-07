import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubMemberRecord} from '../domain'

export const FindClubMemberByPublicKeyParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
})
export type FindClubMemberByPublicKeyParams =
  typeof FindClubMemberByPublicKeyParams.Type

export const createFindClubMemeberByPublicKey = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
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
    UnexpectedServerError.wrapErrors(
      'Error in findClubMemeberByPublicKey query'
    ),
    Effect.withSpan('findClubMemeberByPublicKey query')
  )
})
