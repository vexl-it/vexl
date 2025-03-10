import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Schema} from 'effect'

export const UpdateExpoTokenParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  expoToken: Schema.optionalWith(ExpoNotificationTokenE, {as: 'Option'}),
})
export type UpdateExpoTokenParams = typeof UpdateExpoTokenParams.Type

export const createUpdateExpoToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateExpoTokenParams,
    execute: (params) => sql`
      UPDATE users
      SET
        expo_token = ${params.expoToken ?? null},
        firebase_token = NULL
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateExpoToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateExpoToken query')
  )
})
