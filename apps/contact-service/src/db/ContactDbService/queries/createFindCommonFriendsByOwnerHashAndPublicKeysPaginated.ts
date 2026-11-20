import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {type Fragment} from '@effect/sql/Statement'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow, Schema} from 'effect'
import {createIsAllowedSharedContactHashFragment} from '../../utils/createIsAllowedSharedContactHashFragment'

export const FindCommonFriendsPaginatedParams = Schema.Struct({
  ownerHash: ServerHashedNumber,
  ownerPublicKey: PublicKeyPemBase64,
  publicKeys: Schema.Array(PublicKeyPemBase64),
  publicKeysV2: Schema.Array(PublicKeyV2),
  userContactId: Schema.Int,
  limit: Schema.Int,
  publicImportCountThreshold: Schema.Int,
})
export type FindCommonFriendsPaginatedParams =
  typeof FindCommonFriendsPaginatedParams.Type

export const FindCommonFriendsPaginatedResult = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.NullOr(PublicKeyV2),
  commonFriends: Schema.Array(ServerHashedNumber),
  verifiedFriends: Schema.Array(ServerHashedNumber),
  userContactId: Schema.NumberFromString,
})
export type FindCommonFriendsPaginatedResult =
  typeof FindCommonFriendsPaginatedResult.Type

export const createFindCommonFriendsByOwnerHashAndPublicKeysPaginated =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const isSavedByAccountFragment = (
      friendHash: Fragment,
      accountPublicKey: Fragment
    ): Fragment => sql`
      EXISTS (
        SELECT
          1
        FROM
          users account_number
          INNER JOIN user_contact saved ON saved.hash_to = account_number.hash
        WHERE
          account_number.public_key = ${accountPublicKey}
          AND saved.hash_from = ${friendHash}
      )
    `

    // A friend is verified when they saved any number of the requester's
    // account and any number of the other side's, so the app asks under one
    // number only. An account's numbers share its public key.
    const query = SqlSchema.findAll({
      Request: FindCommonFriendsPaginatedParams,
      Result: FindCommonFriendsPaginatedResult,
      execute: (hash) => sql`
        WITH
          page AS (
            SELECT
              other_side.public_key,
              other_side.public_key_v2,
              MAX(imported_my_contact.id) AS user_contact_id
            FROM
              user_contact AS my_contact
              INNER JOIN user_contact AS imported_my_contact ON my_contact.hash_to = imported_my_contact.hash_to
              INNER JOIN users AS other_side ON other_side.hash = imported_my_contact.hash_from
            WHERE
              ${sql.and([
          sql`my_contact.hash_from = ${hash.ownerHash}`,
          sql`imported_my_contact.id > ${hash.userContactId}`,
          // The number may belong to another account by now
          sql`
            EXISTS (
              SELECT
                1
              FROM
                users requester
              WHERE
                requester.hash = ${hash.ownerHash}
                AND requester.public_key = ${hash.ownerPublicKey}
            )
          `,
          sql.or([
            sql.in('other_side.public_key', hash.publicKeys),
            sql.in('other_side.public_key_v2', hash.publicKeysV2),
          ]),
          createIsAllowedSharedContactHashFragment({
            hashColumn: sql`my_contact.hash_to`,
            publicImportCountThreshold: hash.publicImportCountThreshold,
            sql,
          }),
          sql`other_side.public_key != ${hash.ownerPublicKey}`,
        ])}
            GROUP BY
              other_side.public_key,
              other_side.public_key_v2
            ORDER BY
              user_contact_id ASC
            LIMIT
              ${hash.limit}
          ),
          -- All rows of the page's keys, also those before the cursor
          common_friend AS (
            SELECT DISTINCT
              page.public_key,
              page.public_key_v2,
              my_contact.hash_to
            FROM
              page
              INNER JOIN users AS other_side ON other_side.public_key = page.public_key
              AND other_side.public_key_v2 IS NOT DISTINCT FROM page.public_key_v2
              INNER JOIN user_contact AS imported_my_contact ON imported_my_contact.hash_from = other_side.hash
              INNER JOIN user_contact AS my_contact ON my_contact.hash_to = imported_my_contact.hash_to
              AND my_contact.hash_from = ${hash.ownerHash}
            WHERE
              ${createIsAllowedSharedContactHashFragment({
          hashColumn: sql`my_contact.hash_to`,
          publicImportCountThreshold: hash.publicImportCountThreshold,
          sql,
        })}
          )
        SELECT
          page.user_contact_id,
          page.public_key,
          page.public_key_v2,
          array_agg(
            common_friend.hash_to
            ORDER BY
              common_friend.hash_to
          ) AS common_friends,
          COALESCE(
            array_agg(
              common_friend.hash_to
              ORDER BY
                common_friend.hash_to
            ) FILTER (
              WHERE
                ${isSavedByAccountFragment(
          sql`common_friend.hash_to`,
          sql`${hash.ownerPublicKey}`
        )}
                AND ${isSavedByAccountFragment(
          sql`common_friend.hash_to`,
          sql`page.public_key`
        )}
            ),
            ARRAY[]::VARCHAR[]
          ) AS verified_friends
        FROM
          page
          INNER JOIN common_friend ON common_friend.public_key = page.public_key
          AND common_friend.public_key_v2 IS NOT DISTINCT FROM page.public_key_v2
        GROUP BY
          page.user_contact_id,
          page.public_key,
          page.public_key_v2
        ORDER BY
          page.user_contact_id ASC
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in findCommonFriendsByOwnerHashAndPublicKeyPaginated'
      ),
      Effect.withSpan('findCommonFriendsByOwnerHashAndPublicKeyPaginated query')
    )
  })
