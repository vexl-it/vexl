import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Array, Effect, flow, Schema} from 'effect'

export const createFindHashesByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: PublicKeyPemBase64,
    Result: Schema.Struct({hash: ServerHashedNumber}),
    execute: (publicKey) => sql`
      SELECT
        hash
      FROM
        users
      WHERE
        public_key = ${publicKey}
    `,
  })

  return flow(
    query,
    Effect.map(Array.map((one) => one.hash)),
    UnexpectedServerError.wrapErrors('Error in findHashesByPublicKey'),
    Effect.withSpan('findHashesByPublicKey query')
  )
})
