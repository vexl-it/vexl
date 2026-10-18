import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Schema} from 'effect'
import {PublicKeyHashed} from '../../domain'

export const createFindExistingInboxPublicKeys = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const query = SqlSchema.findAll({
    Request: Schema.NonEmptyArray(PublicKeyHashed),
    Result: Schema.Struct({publicKey: PublicKeyHashed}),
    execute: (publicKeys) => sql`
      SELECT
        public_key
      FROM
        inbox
      WHERE
        ${sql.in('public_key', publicKeys)}
    `,
  })

  return flow(
    query,
    Effect.map(Array.map((one) => one.publicKey)),
    UnexpectedServerError.wrapErrors('Error in findExistingInboxPublicKeys'),
    Effect.withSpan('findExistingInboxPublicKeys query')
  )
})
