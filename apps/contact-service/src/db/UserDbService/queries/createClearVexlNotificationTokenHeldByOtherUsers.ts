import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const ClearVexlNotificationTokenHeldByOtherUsersParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  token: VexlNotificationToken,
})
export type ClearVexlNotificationTokenHeldByOtherUsersParams =
  typeof ClearVexlNotificationTokenHeldByOtherUsersParams.Type

export const createClearVexlNotificationTokenHeldByOtherUsers = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.void({
      Request: ClearVexlNotificationTokenHeldByOtherUsersParams,
      execute: (params) => sql`
        UPDATE users
        SET
          vexl_notification_token = NULL
        WHERE
          vexl_notification_token = ${params.token}
          AND NOT (
            public_key = ${params.publicKey}
            AND hash = ${params.hash}
          )
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in clearVexlNotificationTokenHeldByOtherUsers',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('clearVexlNotificationTokenHeldByOtherUsers query')
    )
  }
)
