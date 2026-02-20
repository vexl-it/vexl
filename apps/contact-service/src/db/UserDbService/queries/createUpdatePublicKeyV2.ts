import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdatePublicKeyV2Params = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  publicKeyV2: PublicKeyV2,
})
export type UpdatePublicKeyV2Params = typeof UpdatePublicKeyV2Params.Type

export const createUpdatePublicKeyV2 = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdatePublicKeyV2Params,
    execute: (params) => sql`
      UPDATE users
      SET
        public_key_v2 = ${params.publicKeyV2}
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updatePublicKeyV2', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updatePublicKeyV2 query')
  )
})
