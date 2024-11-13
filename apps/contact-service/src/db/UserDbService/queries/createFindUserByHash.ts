import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {UserRecord} from '../domain'

export const createFindUserByHash = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: HashedPhoneNumberE,
    Result: UserRecord,
    execute: (params) => sql`
      SELECT
        *
      FROM
        users
      WHERE
        hash = ${params}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findUserByHash', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findUserByHash query')
  )
})
