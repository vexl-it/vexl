import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {countOfAffectedRows} from './countOfAffectedRows'

export const DeleteExpiredAnalyticsStatesParams = Schema.Struct({
  retentionDays: Schema.Int,
})
export type DeleteExpiredAnalyticsStatesParams =
  typeof DeleteExpiredAnalyticsStatesParams.Type

export const createDeleteExpiredAnalyticsStates = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: DeleteExpiredAnalyticsStatesParams,
    Result: Schema.Struct({count: Schema.NumberFromString}),
    execute: (params) => sql`
      WITH
        deleted AS (
          DELETE FROM analytics_states
          WHERE
            start_day < CURRENT_DATE - ${params.retentionDays}::int
          RETURNING
            pk
        )
      SELECT
        COUNT(*) AS COUNT
      FROM
        deleted
    `,
  })

  return flow(
    query,
    Effect.map(countOfAffectedRows),
    UnexpectedServerError.wrapErrors('Error in deleteExpiredAnalyticsStates'),
    Effect.withSpan('deleteExpiredAnalyticsStates query')
  )
})
