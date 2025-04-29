import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord} from '../domain'

export const createListClubsWithExceededReportsCount = Effect.gen(
  function* (_) {
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
          ${sql.and([
          sql`report >= report_limit`,
          sql`made_inactive_at IS NULL`,
        ])}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in listClubsWithExceededReportsCount query',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('listClubsWithExceededReportsCount query')
    )
  }
)
