import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const ListForClubParams = Schema.Struct({
  clubId: ClubRecordId,
})
export type ListForClubParams = typeof ListForClubParams.Type

export const ListForClubResult = Schema.Struct({
  day: Schema.Date,
  joinedCount: Schema.Int,
  leftCount: Schema.Int,
})
export type ListForClubResult = typeof ListForClubResult.Type

export const createListForClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findAll({
    Request: ListForClubParams,
    Result: ListForClubResult,
    execute: (params) => sql`
      SELECT
        DAY,
        joined_count,
        left_count
      FROM
        club_member_count_change
      WHERE
        club_id = ${params.clubId}
        AND DAY >= current_date - 366
      ORDER BY
        DAY
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error in listClubMemberCountChanges query'
    ),
    Effect.withSpan('listClubMemberCountChanges query')
  )
})
