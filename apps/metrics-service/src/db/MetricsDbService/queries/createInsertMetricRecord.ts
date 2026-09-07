import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertMetricsParams = Schema.Struct({
  name: Schema.String,
  uuid: Uuid,
  value: Schema.Int,
  timestamp: Schema.DateFromString,
  type: Schema.Literals(['Increment', 'Total']),
  attributes: Schema.optional(
    Schema.Record(
      Schema.String,
      Schema.Union([Schema.String, Schema.Number, Schema.Boolean])
    )
  ),
})

export type InsertMetricsParams = Schema.Schema.Type<typeof InsertMetricsParams>

export const createInsertMetricRecord = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertMetricsParams,
    execute: (params) => sql`
      INSERT INTO
        "metrics" (name, UUID, value, timestamp, type, attributes)
      VALUES
        (
          ${params.name},
          ${params.uuid},
          ${params.value},
          ${params.timestamp},
          ${params.type},
          ${sql.json(params.attributes ?? null)}::jsonb
        )
      ON CONFLICT (UUID) DO NOTHING
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertMetricRecord'),
    Effect.withSpan('insertMetricRecord query')
  )
})
