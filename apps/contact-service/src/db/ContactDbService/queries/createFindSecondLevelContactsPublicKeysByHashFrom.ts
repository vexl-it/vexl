import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

const ContactWithV2Key = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {
    as: 'Option',
    nullable: true,
  }),
})

export const createFindSecondLevelContactsPublicKeysByHashFrom = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: ServerHashedNumber,
      Result: ContactWithV2Key,
      execute: (hash) => sql`
        SELECT DISTINCT
          second_lvl_friend.public_key,
          second_lvl_friend.public_key_v2
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
