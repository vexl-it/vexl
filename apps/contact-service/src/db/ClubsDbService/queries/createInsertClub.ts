import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord} from '../domain'

export const InsertClubParams = Schema.Struct({
  ...objectCopyAndOmit(ClubDbRecord.fields, 'id'),
})
export type InsertClubParams = typeof InsertClubParams.Type

export const createInsertClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertClub query')
  )
})
