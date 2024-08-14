import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Effect, flow} from 'effect'

export const UpdateFirebaseTokenParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  firebaseToken: Schema.optionalWith(FcmTokenE, {as: 'Option'}),
})
export type UpdateFirebaseTokenParams = Schema.Schema.Type<
  typeof UpdateFirebaseTokenParams
>

export const createUpdateFirebaseToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateFirebaseTokenParams,
    execute: (params) => sql`
      UPDATE users
      SET
        firebase_token = ${params.firebaseToken ?? null},
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateFirebaseToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateFirebaseToken query')
  )
})
