import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const createListExpiredClubs = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
        AND made_inactive_at IS NULL
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in listExpiredClubs query'),
    Effect.withSpan('listExpiredClubs query')
  )
})
