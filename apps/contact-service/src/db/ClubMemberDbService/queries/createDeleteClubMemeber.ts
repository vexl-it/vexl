import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteClubMemberParams = Schema.Struct({
  clubId: ClubRecordId,
  publicKey: PublicKeyPemBase64,
})
export type DeleteClubMemberParams = typeof DeleteClubMemberParams.Type

export const createDeleteClubMemeber = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: DeleteClubMemberParams,
    execute: (params) => sql`
      DELETE FROM club_member
      WHERE
        club_id = ${params.clubId}
        AND public_key = ${params.publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteClubMemeber query'),
    Effect.withSpan('deleteClubMemeber query')
  )
})
