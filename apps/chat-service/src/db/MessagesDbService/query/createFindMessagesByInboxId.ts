import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlClient, SqlSchema} from 'effect/unstable/sql'
import {InboxRecordId} from '../../InboxDbService/domain'
import {MessageRecord} from '../domain'

export const createFindMessagesByInboxId = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

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
