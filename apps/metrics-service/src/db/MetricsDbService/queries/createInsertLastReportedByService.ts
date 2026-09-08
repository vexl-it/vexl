import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertLastReportedByServiceParams = Schema.Struct({
  serviceName: Schema.String,
  lastEventAt: Schema.Date,
})

export type InsertLastReportedByServiceParams =
  typeof InsertLastReportedByServiceParams.Type

export const createInsertLastReportedByService = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertLastReportedByServiceParams,
    execute: (params) => sql`
      INSERT INTO
        "last_reported_by_service" ${sql.insert(params)}
      ON CONFLICT (service_name) DO UPDATE
      SET
        last_event_at = EXCLUDED.last_event_at
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertLastReportedByService'),
    Effect.withSpan('insertLastReportedByService query')
  )
})
