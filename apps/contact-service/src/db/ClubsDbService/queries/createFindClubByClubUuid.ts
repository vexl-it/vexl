import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const FindClubByUuidParams = Schema.Struct({
  uuid: ClubUuid,
})
export type FindClubByUuidParams = typeof FindClubByUuidParams.Type

export const createFindClubByUuid = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
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
