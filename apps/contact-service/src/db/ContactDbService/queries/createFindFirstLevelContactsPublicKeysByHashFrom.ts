import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const ContactWithV2Key = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {
    as: 'Option',
    nullable: true,
  }),
})
export type ContactWithV2Key = typeof ContactWithV2Key.Type

export const createFindFirstLevelContactsPublicKeysByHashFrom = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: ServerHashedNumber,
      Result: ContactWithV2Key,
      execute: (hash) => sql`
        SELECT
          users.public_key,
          users.public_key_v2
        FROM
          user_contact
          INNER JOIN users ON users.hash = user_contact.hash_to
        WHERE
          hash_from = ${hash}
      `,
    })

    return flow(
      query,
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
