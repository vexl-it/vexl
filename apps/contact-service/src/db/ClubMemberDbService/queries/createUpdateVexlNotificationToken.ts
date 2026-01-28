import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const UpdateVexlNotificationTokenParams = Schema.Struct({
  id: ClubRecordId,
  publicKey: PublicKeyPemBase64,
  vexlNotificationToken: VexlNotificationToken,
})
export type UpdateVexlNotificationTokenParams =
  typeof UpdateVexlNotificationTokenParams.Type

export const createUpdateVexlNotificationToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateVexlNotificationTokenParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      UPDATE club_member
      SET
        vexl_notification_token = ${params.vexlNotificationToken},
        last_refreshed_at = now()
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
        Effect.logError(
          'Error in clubmember updateVexlNotificationToken query',
          e
        ),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('clubMember updateVexlNotificationToken query')
  )
})
