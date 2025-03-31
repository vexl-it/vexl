import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord} from '../domain'

export const createListExpiredClubs = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: Schema.Void,
    Result: ClubDbRecord,
    execute: () => sql`
      SELECT
        *
      FROM
        club
      WHERE
        valid_until < now()
        AND valid_until IS NOT NULL
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in listExpiredClubs query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('listExpiredClubs query')
  )
})
