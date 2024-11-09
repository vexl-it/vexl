import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, flow, Schema} from 'effect'

const DeleteContactsByHashFromAndHashToQuery = Schema.Struct({
  hashFrom: HashedPhoneNumberE,
  hashTo: HashedPhoneNumberE,
})

export type DeleteContactsByHashFromAndHashToQuery =
  typeof DeleteContactsByHashFromAndHashToQuery.Type

export const createDeleteContactsByHashFromAndHashTo = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.void({
      Request: DeleteContactsByHashFromAndHashToQuery,
      execute: (hash) => sql`
        DELETE FROM user_contact
        WHERE
          hash_from = ${hash.hashFrom}
          AND hash_to = ${hash.hashTo}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deleteContactsByHashFromAndHashTo', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteContactsByHashFromAndHashTo query')
    )
  }
)
