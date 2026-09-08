import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const CountClubMemebersParams = Schema.Struct({
  id: ClubRecordId,
})
export type CountClubMemebersParams = typeof CountClubMemebersParams.Type

export const createCountClubMemebers = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: CountClubMemebersParams,
    Result: Schema.Struct({
      countResult: NumberFromString,
    }),
    execute: (params) => sql`
      SELECT
        count(id) AS count_result
      FROM
        club_member
      WHERE
        club_id = ${params.id}
    `,
  })

  return flow(
    query,
    Effect.map((result) => result.countResult),
    UnexpectedServerError.wrapErrors('Error in countClubMemebers query'),
    Effect.withSpan('countClubMemebers query')
  )
})
