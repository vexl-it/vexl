import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {InboxRecordId} from '../../InboxDbService/domain'

export const createDeleteAllMessagesByInboxId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InboxRecordId,
    execute: (params) => sql`
      DELETE FROM message
      WHERE
        inbox_id = ${params}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteAllMessagesByInboxId'),
    Effect.withSpan('deleteAllMessagesByInboxId find')
  )
})
