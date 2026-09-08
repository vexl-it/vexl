import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateExpoTokenParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  expoToken: Schema.OptionFromOptional(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type UpdateExpoTokenParams = typeof UpdateExpoTokenParams.Type

export const createUpdateExpoToken = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
    UnexpectedServerError.wrapErrors('Error in updateExpoToken'),
    Effect.withSpan('updateExpoToken query')
  )
})
