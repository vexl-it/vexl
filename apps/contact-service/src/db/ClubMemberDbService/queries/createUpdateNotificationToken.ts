import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const UpdateNotificationTokenParams = Schema.Struct({
  id: ClubRecordId,
  publicKey: PublicKeyPemBase64E,
  notificationToken: Schema.NullOr(ExpoNotificationTokenE),
})
export type UpdateNotificationTokenParams =
  typeof UpdateNotificationTokenParams.Type

export const createUpdateNotificationToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateNotificationTokenParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      UPDATE club_member
      SET
        notification_token = ${params.notificationToken},
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
        Effect.logError('Error in clubmember updateNotificationToken query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('clubMember updateNotificationToken query')
  )
})
