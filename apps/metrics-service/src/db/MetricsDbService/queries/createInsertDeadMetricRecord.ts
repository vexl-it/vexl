import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertDeadMetricsParams = Schema.Struct({
  data: Schema.fromJsonString(Schema.Unknown),
  message: Schema.String,
  accepted_at: Schema.Date,
})

export type InsertDeadMetricsParams = typeof InsertDeadMetricsParams.Type

export const createInsertDeadMetricRecord = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertDeadMetricsParams,
    execute: (params) => sql`
      INSERT INTO
        "dead_metrics" ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertDeadMetricRecord'),
    Effect.withSpan('insertDeadMetricRecord query')
  )
})
