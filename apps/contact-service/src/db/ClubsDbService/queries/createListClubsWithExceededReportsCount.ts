import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const createListClubsWithExceededReportsCount = Effect.gen(function* () {
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
        ${sql.and([sql`report >= report_limit`, sql`made_inactive_at IS NULL`])}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error in listClubsWithExceededReportsCount query'
    ),
    Effect.withSpan('listClubsWithExceededReportsCount query')
  )
})
