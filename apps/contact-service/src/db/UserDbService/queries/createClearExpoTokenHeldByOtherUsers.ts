import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const ClearExpoTokenHeldByOtherUsersParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  token: ExpoNotificationToken,
})
export type ClearExpoTokenHeldByOtherUsersParams =
  typeof ClearExpoTokenHeldByOtherUsersParams.Type

export const createClearExpoTokenHeldByOtherUsers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: ClearExpoTokenHeldByOtherUsersParams,
    execute: (params) => sql`
      UPDATE users
      SET
        expo_token = NULL
      WHERE
        expo_token = ${params.token}
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
        Effect.logError('Error in clearExpoTokenHeldByOtherUsers', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('clearExpoTokenHeldByOtherUsers query')
  )
})
