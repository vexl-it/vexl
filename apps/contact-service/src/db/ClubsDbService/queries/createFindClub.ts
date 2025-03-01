import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const FindClubParams = Schema.Struct({
  id: ClubRecordId,
})
export type FindClubParams = typeof FindClubParams.Type

export const createFindClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindClubParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club
      WHERE
        id = ${params.id}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findClub query')
  )
})
