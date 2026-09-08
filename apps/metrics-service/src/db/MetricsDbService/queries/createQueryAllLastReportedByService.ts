import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {LastReportedByServiceRecord} from '../domain'

export const createQueryAllLastReportedByService = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
    UnexpectedServerError.wrapErrors('Error in queryAllLastReportedByService'),
    Effect.withSpan('queryAllLastReportedByService query')
  )
})
