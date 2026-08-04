import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubAdminDbRecord} from '../domain'

export const FindClubAdminByUuidParams = Schema.Struct({
  uuid: ClubUuid,
})
export type FindClubAdminByUuidParams = typeof FindClubAdminByUuidParams.Type

export const createFindClubAdminByUuid = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindClubAdminByUuidParams,
    Result: ClubAdminDbRecord,
    execute: (params) => sql`
      SELECT
        club.*,
        (
          SELECT
            count(*)::int
          FROM
            club_member
          WHERE
            club_id = club.id
        ) AS members_count,
        coalesce(
          (
            SELECT
              sum(joined_count)
            FROM
              club_member_count_change
            WHERE
              club_id = club.id
              AND DAY >= current_date - 30
          ),
          0
        )::int AS members_joined_last30_days,
        coalesce(
          (
            SELECT
              sum(left_count)
            FROM
              club_member_count_change
            WHERE
              club_id = club.id
              AND DAY >= current_date - 30
          ),
          0
        )::int AS members_left_last30_days
      FROM
        club
      WHERE
        UUID = ${params.uuid}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findClubAdminByUuid query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findClubAdminByUuid query')
  )
})
