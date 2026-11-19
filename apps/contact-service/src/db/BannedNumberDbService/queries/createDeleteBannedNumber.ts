import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {BannedNumberId} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, flow, Option, Schema} from 'effect'

export const createDeleteBannedNumber = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: BannedNumberId,
    Result: Schema.Struct({id: BannedNumberId}),
    execute: (id) => sql`
      DELETE FROM banned_number
      WHERE
        id = ${id}
      RETURNING
        id
    `,
  })

  return flow(
    query,
    Effect.map(Option.isSome),
    UnexpectedServerError.wrapErrors('Error in deleteBannedNumber query'),
    Effect.withSpan('deleteBannedNumber query')
  )
})
