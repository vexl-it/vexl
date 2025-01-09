import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Option, pipe, Schema} from 'effect'

export const createDeleteExpiredMessages = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: Schema.Null,
    Result: Schema.Struct({
      count: Schema.NumberFromString,
    }),
    execute: () => sql`
      WITH
        deleted AS (
          DELETE FROM message
          WHERE
            expires_at <= NOW()
          RETURNING
            *
        )
      SELECT
        COUNT(*) AS COUNT
      FROM
        deleted;
    `,
  })(null).pipe(
    Effect.map(
      flow(
        Option.map((r) => r.count),
        Option.getOrElse(() => 0)
      )
    )
  )

  return () =>
    pipe(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deleteExpiredMessages', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteExpiredMessages find')
    )
})
