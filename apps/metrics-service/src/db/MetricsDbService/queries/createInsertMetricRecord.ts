import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, flow, Schema} from 'effect'

export const InsertMetricsParams = Schema.Struct({
  name: Schema.String,
  uuid: Uuid,
  value: Schema.Int,
  timestamp: Schema.Date,
  type: Schema.Literal('Increment', 'Total'),
  attributes: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
    })
  ),
})

export type InsertMetricsParams = Schema.Schema.Type<typeof InsertMetricsParams>

export const createInsertMetricRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

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
    Effect.catchAll((e): Effect.Effect<void, UnexpectedServerError> => {
      return Effect.zipRight(
        Effect.logError('Error in insertMetricRecord', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    }),
    Effect.withSpan('insertMetricRecord query')
  )
})
