import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow, Schema} from 'effect'

export const AccountSessionRow = Schema.Struct({
  hash: ServerHashedNumber,
  loginSessionId: Schema.optionalWith(LoginSessionId, {
    as: 'Option',
    nullable: true,
  }),
})
export type AccountSessionRow = typeof AccountSessionRow.Type

export const createFindAccountSessionsByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: PublicKeyPemBase64,
    Result: AccountSessionRow,
    execute: (publicKey) => sql`
      SELECT
        hash,
        login_session_id
      FROM
        users
      WHERE
        public_key = ${publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findAccountSessionsByPublicKey'),
    Effect.withSpan('findAccountSessionsByPublicKey query')
  )
})
