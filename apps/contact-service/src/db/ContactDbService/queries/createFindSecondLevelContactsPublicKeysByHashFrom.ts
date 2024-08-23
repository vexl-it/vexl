import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Effect, flow} from 'effect'

export const createFindSecondLevelContactsPublicKeysByHashFrom = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: HashedPhoneNumberE,
      Result: Schema.Struct({publicKey: PublicKeyPemBase64E}),
      execute: (hash) => sql`
        SELECT DISTINCT
          second_lvl_friend.public_key
        FROM
          user_contact my_contacts
          INNER JOIN user_contact their_contacts ON my_contacts.hash_to = their_contacts.hash_to
          INNER JOIN users second_lvl_friend ON their_contacts.hash_from = second_lvl_friend.hash
        WHERE
          my_contacts.hash_from = ${hash}
          AND second_lvl_friend.hash != ${hash};
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((e) => e.publicKey)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findSecondLevelContactPublicKeysByHashFrom',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findSecondLevelContactPublicKeysByHashFrom query')
    )
  }
)
