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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findMessagesByInboxId', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findMessagesByInboxId find')
  )
})
