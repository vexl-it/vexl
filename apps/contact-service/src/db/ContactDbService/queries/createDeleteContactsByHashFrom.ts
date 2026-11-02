import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow} from 'effect'

export const createDeleteContactsByHashFrom = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: ServerHashedNumber,
    execute: (hash) => sql`
      DELETE FROM user_contact
      WHERE
        hash_from = ${hash}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in deleteContactsByHashFrom'),
    Effect.withSpan('deleteContactsByHashFrom query')
  )
})
