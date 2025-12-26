import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const DeleteClubMemberParams = Schema.Struct({
  clubId: ClubRecordId,
  publicKey: PublicKeyPemBase64,
})
export type DeleteClubMemberParams = typeof DeleteClubMemberParams.Type

export const createDeleteClubMemeber = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteClubMemeber query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteClubMemeber query')
  )
})
