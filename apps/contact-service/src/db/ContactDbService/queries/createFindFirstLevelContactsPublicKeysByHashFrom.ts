import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Effect, flow, Schema} from 'effect'

export const createFindFirstLevelContactsPublicKeysByHashFrom = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: HashedPhoneNumberE,
      Result: Schema.Struct({publicKey: PublicKeyPemBase64E}),
      execute: (hash) => sql`
        SELECT
          users.public_key
        FROM
          user_contact
          INNER JOIN users ON users.hash = user_contact.hash_to
        WHERE
          hash_from = ${hash}
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((e) => e.publicKey)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findFirstLevelContactPublicKeysByHashFrom',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findFirstLevelContactPublicKeysByHashFrom query')
    )
  }
)
