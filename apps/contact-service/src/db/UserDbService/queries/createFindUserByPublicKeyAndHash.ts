import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'
import {UserRecord} from '../domain'

export const createFindUserbyPublicKeyAndHash = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
    Request: Schema.Struct({
      hash: ServerHashedNumber,
      publicKey: PublicKeyPemBase64,
    }),
    Result: UserRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        users
      WHERE
        hash = ${params.hash}
        AND public_key = ${params.publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findUserbyPublicKeyAndHash'),
    Effect.withSpan('findUserbyPublicKeyAndHash query')
  )
})
