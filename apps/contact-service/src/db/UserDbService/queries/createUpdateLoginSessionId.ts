import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateLoginSessionIdParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  loginSessionId: LoginSessionId,
})
export type UpdateLoginSessionIdParams = typeof UpdateLoginSessionIdParams.Type

export const createUpdateLoginSessionId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateLoginSessionIdParams,
    execute: (params) => sql`
      UPDATE users
      SET
        login_session_id = ${params.loginSessionId}
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in updateLoginSessionId'),
    Effect.withSpan('updateLoginSessionId query')
  )
})
