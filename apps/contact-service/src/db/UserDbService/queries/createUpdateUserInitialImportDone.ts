import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateUserInitialImportDoneParams = Schema.Struct({
  hash: ServerHashedNumber,
  initialImportDone: Schema.Boolean,
})
export type UpdateUserInitialImportDoneParams =
  typeof UpdateUserInitialImportDoneParams.Type

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
