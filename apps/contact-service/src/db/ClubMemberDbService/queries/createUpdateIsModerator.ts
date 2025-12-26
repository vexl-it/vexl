import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const UpdateIsModeratorParamas = Schema.Struct({
  id: ClubRecordId,
  publicKey: PublicKeyPemBase64,
  isModerator: Schema.Boolean, // TODO brand
})
export type UpdateIsModeratorParamas = typeof UpdateIsModeratorParamas.Type

export const createUpdateIsModerator = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateIsModeratorParamas,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      UPDATE club_member
      SET
        is_moderator = ${params.isModerator}
      WHERE
        club_id = ${params.id}
        AND public_key = ${params.publicKey}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in clubmember updateIsModerator query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('clubMember updateIsModerator query')
  )
})
