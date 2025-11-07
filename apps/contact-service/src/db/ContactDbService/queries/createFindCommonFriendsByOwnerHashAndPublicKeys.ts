import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const FindCommonFriendsParams = Schema.Struct({
  ownerHash: ServerHashedNumber,
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type FindCommonFriendsParams = typeof FindCommonFriendsParams.Type

export const FindCommonFriendsResult = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  commonFriends: Schema.Array(ServerHashedNumber),
})
export type FindCommonFriendsResult = typeof FindCommonFriendsResult.Type

export const createFindCommonFriendsByOwnerHashAndPublicKeys = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    // TODO this can be cached for one public key and then invalidated on insert. The problem is how to invalidate with wildcards
    const query = SqlSchema.findAll({
      Request: FindCommonFriendsParams,
      Result: FindCommonFriendsResult,
      execute: (hash) => sql`
        SELECT
          other_side.public_key AS public_key,
          array_agg(DISTINCT imported_my_contact.hash_to) AS common_friends
        FROM
          user_contact AS my_contact
          INNER JOIN user_contact AS imported_my_contact ON my_contact.hash_to = imported_my_contact.hash_to
          INNER JOIN users AS other_side ON other_side.hash = imported_my_contact.hash_from
        WHERE
          ${sql.and([
          sql`my_contact.hash_from = ${hash.ownerHash}`,
          sql.in('other_side.public_key', hash.publicKeys),
        ])}
        GROUP BY
          other_side.public_key;
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findCommonFriendsByOwnerHashAndPublicKey',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findCommonFriendsByOwnerHashAndPublicKey query')
    )
  }
)
