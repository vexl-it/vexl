import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {InboxRecordId} from '../../InboxDbService/domain'

export const createDeleteAllMessagesByInboxId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteAllMessagesByInboxId', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteAllMessagesByInboxId find')
  )
})
