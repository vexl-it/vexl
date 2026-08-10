import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'
import {ClubMemberRecord} from '../domain'

export const QueryAllClubMemebersParams = Schema.Struct({
  id: ClubRecordId,
})
export type QueryAllClubMemebersParams = typeof QueryAllClubMemebersParams.Type

export const createQueryAllClubMembers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: QueryAllClubMemebersParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club_member
      WHERE
        club_id = ${params.id}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in queryAllClubMembers query'),
    Effect.withSpan('queryAllClubMembers query')
  )
})
