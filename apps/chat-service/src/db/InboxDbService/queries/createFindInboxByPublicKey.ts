import {SqlClient, SqlSchema} from '@effect/sql'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {InboxRecord} from '../domain'

export const createFindInboxByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const query = SqlSchema.findOne({
    Request: PublicKeyPemBase64E,
    Result: InboxRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        inbox
      WHERE
        public_key = ${params}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findInboxByPublicKey', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findInboxByPublicKey query')
  )
})
