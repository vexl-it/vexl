import {SqlClient, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {InboxRecordId} from '../../InboxDbService/domain'
import {MessageRecord} from '../domain'

export const createFindMessagesByInboxId = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const query = SqlSchema.findAll({
    Request: InboxRecordId,
    Result: MessageRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        message
      WHERE
        inbox_id = ${params}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findMessagesByInboxId'),
    Effect.withSpan('findMessagesByInboxId find')
  )
})
