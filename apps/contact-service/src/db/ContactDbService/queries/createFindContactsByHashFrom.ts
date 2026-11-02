import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow} from 'effect'
import {ContactRecord} from '../domain'

export const createFindContactsByHashFrom = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: ServerHashedNumber,
    Result: ContactRecord,
    execute: (hash) => sql`
      SELECT
        *
      FROM
        user_contact
      WHERE
        hash_from = ${hash}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in findContactsByHashFrom'),
    Effect.withSpan('findContactsByHashFrom query')
  )
})
