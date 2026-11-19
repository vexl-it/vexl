import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const createCountBannedNumbersAddedThisMonth = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: Schema.Void,
    Result: Schema.Struct({count: Schema.Int}),
    execute: () => sql`
      SELECT
        count(*)::int AS count
      FROM
        banned_number
      WHERE
        created_at >= date_trunc('month', now())
    `,
  })

  return flow(
    query,
    Effect.map(({count}) => count),
    UnexpectedServerError.wrapErrors(
      'Error in countBannedNumbersAddedThisMonth query'
    ),
    Effect.withSpan('countBannedNumbersAddedThisMonth query')
  )
})
