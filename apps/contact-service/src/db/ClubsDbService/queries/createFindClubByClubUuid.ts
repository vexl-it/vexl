import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord} from '../domain'

export const FindClubByUuidParams = Schema.Struct({
  uuid: ClubUuid,
})
export type FindClubByUuidParams = typeof FindClubByUuidParams.Type

export const createFindClubByUuid = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: FindClubByUuidParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        club
      WHERE
        UUID = ${params.uuid}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findClubByUuid query'),
    Effect.withSpan('findClubByUuid query')
  )
})
