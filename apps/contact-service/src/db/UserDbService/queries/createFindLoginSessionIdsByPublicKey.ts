import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {Array, Effect, flow, Schema} from 'effect'

export const createFindLoginSessionIdsByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: PublicKeyPemBase64,
    Result: Schema.Struct({loginSessionId: LoginSessionId}),
    execute: (publicKey) => sql`
      SELECT DISTINCT
        login_session_id
      FROM
        users
      WHERE
        public_key = ${publicKey}
        AND login_session_id IS NOT NULL
    `,
  })

  return flow(
    query,
    Effect.map(Array.map((one) => one.loginSessionId)),
    UnexpectedServerError.wrapErrors('Error in findLoginSessionIdsByPublicKey'),
    Effect.withSpan('findLoginSessionIdsByPublicKey query')
  )
})
