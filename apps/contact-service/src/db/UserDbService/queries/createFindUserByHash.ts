import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow} from 'effect'
import {UserRecord} from '../domain'

export const createFindUserByHash = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: ServerHashedNumber,
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
    UnexpectedServerError.wrapErrors('Error in findUserByHash'),
    Effect.withSpan('findUserByHash query')
  )
})
