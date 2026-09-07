import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {ClubRecordId} from '../domain'

export const DeleteClubParams = Schema.Struct({
  id: ClubRecordId,
})
export type DeleteClubParams = typeof DeleteClubParams.Type

export const createDeleteClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const resolver = SqlResolver.void({
    Request: DeleteClubParams,
    execute: (params) => sql`
      DELETE FROM club
      WHERE
        ${sql.in(
        'id',
        params.map((one) => one.id)
      )}
    `,
  })

  return flow(
    SqlResolver.request(resolver),
    UnexpectedServerError.wrapErrors('Error in deleteClub query'),
    Effect.withSpan('deleteClub query')
  )
})
