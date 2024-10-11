import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, flow} from 'effect'

export class MessageWithUuidAlreadyStoredError extends Schema.TaggedError<MessageWithUuidAlreadyStoredError>(
  'MessageWithUuidAlreadyStoredError'
)('MessageWithUuidAlreadyStoredError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export const InsertMetricsParams = Schema.Struct({
  name: Schema.String,
  uuid: UuidE,
  value: Schema.Int,
  timestamp: Schema.Date,
  type: Schema.Literal('Increment', 'Total'),
  attributes: Schema.optional(
    Schema.parseJson(
      Schema.Record({
        key: Schema.String,
        value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
      })
    )
  ),
})

export type InsertMetricsParams = Schema.Schema.Type<typeof InsertMetricsParams>

export const createInsertMetricRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertMetricsParams,
    execute: (params) => sql`
      INSERT INTO
        "metrics" ${sql.insert({
        ...params,
        attributes: params.attributes ?? null,
      })}
    `,
  })

  return flow(
    query,
    Effect.catchAll(
      (
        e
      ): Effect.Effect<
        void,
        MessageWithUuidAlreadyStoredError | UnexpectedServerError
      > => {
        if (
          e._tag === 'SqlError' &&
          (e.cause as any)?.code === '23505' &&
          (e.cause as any)?.constraint_name === 'metrics_uuid_key'
        ) {
          const cause = e.cause as any
          return Effect.fail(
            new MessageWithUuidAlreadyStoredError({
              message: String(cause.detail),
              cause: e,
            })
          )
        }
        return Effect.zipRight(
          Effect.logError('Error in insertMetricRecord', e),
          Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
        )
      }
    ),
    Effect.withSpan('insertMetricRecord query')
  )
})
