import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const FindClubMemberParams = Schema.Struct({
  id: ClubRecordId,
  publicKey: PublicKeyPemBase64,
})
export type FindClubMemberParams = typeof FindClubMemberParams.Type

export const createFindClubMemeber = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
    Request: FindClubMemberParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_member
      WHERE
        club_id = ${params.id}
        AND public_key = ${params.publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findClubMemeber query'),
    Effect.withSpan('clubMemeber query')
  )
})
