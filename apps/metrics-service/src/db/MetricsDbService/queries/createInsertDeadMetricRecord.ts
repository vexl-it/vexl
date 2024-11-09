import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertDeadMetricsParams = Schema.Struct({
  data: Schema.parseJson(Schema.Unknown),
  message: Schema.String,
  accepted_at: Schema.DateFromSelf,
})

export type InsertDeadMetricsParams = Schema.Schema.Type<
  typeof InsertDeadMetricsParams
>

export const createInsertDeadMetricRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertDeadMetricsParams,
    execute: (params) => sql`
      INSERT INTO
        "dead_metrics" ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertDeadMetricRecord', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('insertDeadMetricRecord query')
  )
})
