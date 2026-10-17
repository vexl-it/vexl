import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {countOfAffectedRows} from './countOfAffectedRows'

export const ExpireAnalyticsStateIdsParams = Schema.Struct({
  name: Schema.String,
  maxAgeDays: Schema.Int,
})
export type ExpireAnalyticsStateIdsParams =
  typeof ExpireAnalyticsStateIdsParams.Type

export const createExpireAnalyticsStateIds = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: ExpireAnalyticsStateIdsParams,
    Result: Schema.Struct({count: Schema.NumberFromString}),
    execute: (params) => sql`
      WITH
        expired AS (
          UPDATE analytics_states
          SET
            id = NULL
          WHERE
            id IS NOT NULL
            AND name = ${params.name}
            AND start_day < CURRENT_DATE - ${params.maxAgeDays}::int
          RETURNING
            pk
        )
      SELECT
        COUNT(*) AS COUNT
      FROM
        expired
    `,
  })

  return flow(
    query,
    Effect.map(countOfAffectedRows),
    UnexpectedServerError.wrapErrors('Error in expireAnalyticsStateIds'),
    Effect.withSpan('expireAnalyticsStateIds query')
  )
})
