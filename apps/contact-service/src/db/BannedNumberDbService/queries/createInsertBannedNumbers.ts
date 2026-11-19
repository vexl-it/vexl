import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {BannedNumberId} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, flow, Schema} from 'effect'

export const InsertBannedNumberParams = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  hash: ServerHashedNumber,
  note: Schema.NullOr(Schema.String),
})
export type InsertBannedNumberParams = typeof InsertBannedNumberParams.Type

export const createInsertBannedNumbers = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: Schema.Array(InsertBannedNumberParams),
    Result: Schema.Struct({id: BannedNumberId}),
    execute: (numbers) => sql`
      INSERT INTO
        banned_number ${sql.insert(numbers)}
      ON CONFLICT DO NOTHING
      RETURNING
        id
    `,
  })

  return flow(
    query,
    Effect.map(Array.length),
    UnexpectedServerError.wrapErrors('Error in insertBannedNumbers query'),
    Effect.withSpan('insertBannedNumbers query')
  )
})
