import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertLastReportedByServiceParams = Schema.Struct({
  serviceName: Schema.String,
  lastEventAt: Schema.DateFromSelf,
})

export type InsertLastReportedByServiceParams =
  typeof InsertLastReportedByServiceParams.Type

export const createInsertLastReportedByService = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertLastReportedByService', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('insertLastReportedByService query')
  )
})
