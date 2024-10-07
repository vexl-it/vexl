import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, flow} from 'effect'

export const UpdateUserInitialImportDoneParams = Schema.Struct({
  hash: HashedPhoneNumberE,
  initialImportDone: Schema.Boolean,
})
export type UpdateUserInitialImportDoneParams = Schema.Schema.Type<
  typeof UpdateUserInitialImportDoneParams
>

export const createUpdateUserInitialImportDone = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateUserInitialImportDoneParams,
    execute: (params) => sql`
      UPDATE users
      SET
        initial_import_done = ${params.initialImportDone}
      WHERE
        hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateUserInitialImportDone', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateUserInitialImportDone query')
  )
})
