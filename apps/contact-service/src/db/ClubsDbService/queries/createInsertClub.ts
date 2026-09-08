import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord} from '../domain'

export const InsertClubParams = Schema.Struct({
  ...objectCopyAndOmit(ClubDbRecord.fields, 'id'),
})
export type InsertClubParams = typeof InsertClubParams.Type

export const createInsertClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: InsertClubParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      INSERT INTO
        club ${sql.insert({...params, description: params.description ?? null})}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertClub query'),
    Effect.withSpan('insertClub query')
  )
})
