import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {LastReportedByServiceRecord} from '../domain'

export const createQueryAllLastReportedByService = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: Schema.Void,
    Result: LastReportedByServiceRecord,
    execute: () => sql`
      SELECT
        *
      FROM
        last_reported_by_service
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in queryAllLastReportedByService', e),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('queryAllLastReportedByService query')
  )
})
