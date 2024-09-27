import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, flow} from 'effect'

export const UpdateUserHashParams = Schema.Struct({
  oldHash: HashedPhoneNumberE,
  newHash: HashedPhoneNumberE,
})
export type UpdateUserHashParams = Schema.Schema.Type<
  typeof UpdateUserHashParams
>

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
