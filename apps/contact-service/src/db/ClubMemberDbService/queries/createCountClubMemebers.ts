import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const CountClubMemebersParams = Schema.Struct({
  id: ClubRecordId,
})
export type CountClubMemebersParams = typeof CountClubMemebersParams.Type

export const createCountClubMemebers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: CountClubMemebersParams,
    Result: Schema.Struct({
      countResult: Schema.NumberFromString,
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in countClubMemebers query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('countClubMemebers query')
  )
})
