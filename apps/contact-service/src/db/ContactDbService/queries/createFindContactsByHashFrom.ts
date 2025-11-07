import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findContactsByHashFrom', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findContactsByHashFrom query')
  )
})
