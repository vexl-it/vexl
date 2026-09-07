import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const createDeleteUserByPublicKeyAndHash = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: Schema.Struct({
      hash: ServerHashedNumber,
      publicKey: PublicKeyPemBase64,
    }),
    execute: (params) => sql`
      DELETE FROM users
      WHERE
        hash = ${params.hash}
        AND public_key = ${params.publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteUserByPublicKeyAndHash'),
    Effect.withSpan('deleteUserByPublicKeyAndHash query')
  )
})
