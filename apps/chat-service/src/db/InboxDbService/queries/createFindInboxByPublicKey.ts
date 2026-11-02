import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {PublicKeyHashed} from '../../domain'
import {InboxRecord} from '../domain'

export const createFindInboxByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const query = SqlSchema.findOne({
    Request: PublicKeyHashed,
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
    UnexpectedServerError.wrapErrors('Error in findInboxByPublicKey'),
    Effect.withSpan('findInboxByPublicKey query')
  )
})
