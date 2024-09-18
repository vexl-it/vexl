import {PgClient} from '@effect/sql-pg'
import {Effect} from 'effect'

export const creatInsertChallenge = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  yield* _(sql`
    SELECT
      *
    FROM
      USER
  `)
})
