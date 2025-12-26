import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const FindCommonFriendsPaginatedParams = Schema.Struct({
  ownerHash: ServerHashedNumber,
  publicKeys: Schema.Array(PublicKeyPemBase64),
  userContactId: Schema.Int,
  limit: Schema.Int,
})
export type FindCommonFriendsPaginatedParams =
  typeof FindCommonFriendsPaginatedParams.Type

export const FindCommonFriendsPaginatedResult = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  commonFriends: Schema.Array(ServerHashedNumber),
  userContactId: Schema.NumberFromString,
})
export type FindCommonFriendsPaginatedResult =
  typeof FindCommonFriendsPaginatedResult.Type

export const createFindCommonFriendsByOwnerHashAndPublicKeysPaginated =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindCommonFriendsPaginatedParams,
      Result: FindCommonFriendsPaginatedResult,
      execute: (hash) => sql`
        SELECT
          MAX(imported_my_contact.id) AS user_contact_id,
          other_side.public_key AS public_key,
          array_agg(DISTINCT imported_my_contact.hash_to) AS common_friends
        FROM
          user_contact AS my_contact
          INNER JOIN user_contact AS imported_my_contact ON my_contact.hash_to = imported_my_contact.hash_to
          INNER JOIN users AS other_side ON other_side.hash = imported_my_contact.hash_from
        WHERE
          ${sql.and([
          sql`my_contact.hash_from = ${hash.ownerHash}`,
          sql`imported_my_contact.id > ${hash.userContactId}`,
          sql.in('other_side.public_key', hash.publicKeys),
        ])}
        GROUP BY
          other_side.public_key
        ORDER BY
          MAX(imported_my_contact.id) ASC
        LIMIT
          ${hash.limit}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findCommonFriendsByOwnerHashAndPublicKeyPaginated',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findCommonFriendsByOwnerHashAndPublicKeyPaginated query')
    )
  })
