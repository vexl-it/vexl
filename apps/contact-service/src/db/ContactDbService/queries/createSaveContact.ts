import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlClient, SqlResolver} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

const InsertContactParams = Schema.Struct({
  hashFrom: ServerHashedNumber,
  hashTo: ServerHashedNumber,
})
export type InsertContactParams = Schema.Schema.Type<typeof InsertContactParams>

export const createInsertContact = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const resolver = SqlResolver.void({
    Request: InsertContactParams,
    execute: (params) => sql`
      INSERT INTO
        user_contact ${sql.insert(params)}
      RETURNING
        *
    `,
  })

  return flow(
    SqlResolver.request(resolver),
    UnexpectedServerError.wrapErrors('Error in insertContact'),
    Effect.withSpan('insertContact query')
  )
})
