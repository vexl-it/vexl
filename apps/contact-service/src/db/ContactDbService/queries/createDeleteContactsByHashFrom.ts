import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteContactsByHashFrom', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteContactsByHashFrom query')
  )
})
