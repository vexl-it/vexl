import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Effect, flow, Option, pipe, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const createDeleteExpiredMessages = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
    Request: Schema.Null,
    Result: Schema.Struct({
      count: NumberFromString,
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
      UnexpectedServerError.wrapErrors('Error in deleteExpiredMessages'),
      Effect.withSpan('deleteExpiredMessages find')
    )
})
