import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Option, Schema} from 'effect'
import {InboxRecordId} from '../../InboxDbService/domain'

export const createDeletePulledMessagesMessagesByInboxId = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findOne({
      Result: Schema.Struct({count: Schema.NumberFromString}),
      Request: InboxRecordId,
      execute: (params) => sql`
        WITH
          deleted AS (
            DELETE FROM message
            WHERE
              inbox_id = ${params}
              AND pulled = TRUE
          )
        SELECT
          count(*) AS COUNT
      `,
    })

    return flow(
      query,
      Effect.map(
        flow(
          Option.map((r) => r.count),
          Option.getOrElse(() => 0)
        )
      ),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deletePulledMessagesByInboxId', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deletePulledMessagesByInboxId find')
    )
  }
)
