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
        coalesce(members.members_count, 0)::int AS members_count,
        coalesce(changes.members_joined_last30_days, 0)::int AS members_joined_last30_days,
        coalesce(changes.members_left_last30_days, 0)::int AS members_left_last30_days
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
        LEFT JOIN (
          SELECT
            club_id,
            sum(joined_count)::int AS members_joined_last30_days,
            sum(left_count)::int AS members_left_last30_days
          FROM
            club_member_count_change
          WHERE
            DAY >= current_date - 30
          GROUP BY
            club_id
        ) AS changes ON changes.club_id = club.id
      ORDER BY
        lower(club.name)
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in listClubs query'),
    Effect.withSpan('listClubs query')
  )
})
