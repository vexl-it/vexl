import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateUserHashParams = Schema.Struct({
  oldHash: ServerHashedNumber,
  newHash: ServerHashedNumber,
})
export type UpdateUserHashParams = typeof UpdateUserHashParams.Type

export const createUpdateUserHash = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateUserHashParams,
    execute: (params) => sql`
      UPDATE users
      SET
        hash = ${params.newHash}
      WHERE
        hash = ${params.oldHash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateUserHash', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateUserHash query')
  )
})
