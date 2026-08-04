import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubAdminDbRecord} from '../domain'

export const createListClubs = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: Schema.Void,
    Result: ClubAdminDbRecord,
    execute: (params) => sql`
      SELECT
        club.*,
        coalesce(members.members_count, 0)::int AS members_count
      FROM
        club
        LEFT JOIN (
          SELECT
            club_id,
            count(*)::int AS members_count
          FROM
            club_member
          GROUP BY
            club_id
        ) AS members ON members.club_id = club.id
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in listClubs query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('listClubs query')
  )
})
