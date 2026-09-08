import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const FindClubParams = Schema.Struct({
  id: ClubRecordId,
})
export type FindClubParams = typeof FindClubParams.Type

export const createFindClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
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
    UnexpectedServerError.wrapErrors('Error in findClub query'),
    Effect.withSpan('findClub query')
  )
})
