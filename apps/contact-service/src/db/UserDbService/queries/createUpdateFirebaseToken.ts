import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateFirebaseTokenParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  firebaseToken: Schema.optionalWith(FcmToken, {as: 'Option'}),
})
export type UpdateFirebaseTokenParams = typeof UpdateFirebaseTokenParams.Type

export const createUpdateFirebaseToken = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateFirebaseTokenParams,
    execute: (params) => sql`
      UPDATE users
      SET
        firebase_token = ${params.firebaseToken ?? null}
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
