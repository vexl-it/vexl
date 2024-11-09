import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, flow, Schema} from 'effect'

const UpdateContactsHashFromQuery = Schema.Struct({
  currentHashFrom: HashedPhoneNumberE,
  newHashFrom: HashedPhoneNumberE,
})

export type UpdateContactsHashFromQuery =
  typeof UpdateContactsHashFromQuery.Type

export const createUpdateContactsHashFrom = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateContactsHashFromQuery,
    execute: (hash) => sql`
      UPDATE user_contact
      SET
        hash_from = ${hash.newHashFrom}
      WHERE
        hash_from = ${hash.currentHashFrom}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateContactsHashFrom', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateContactsHashFrom query')
  )
})
