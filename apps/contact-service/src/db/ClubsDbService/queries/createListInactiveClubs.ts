import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const createListInactiveClubs = Effect.gen(function* () {
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
        made_inactive_at IS NOT NULL
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in listInactiveClubs query'),
    Effect.withSpan('listInactiveClubs query')
  )
})
