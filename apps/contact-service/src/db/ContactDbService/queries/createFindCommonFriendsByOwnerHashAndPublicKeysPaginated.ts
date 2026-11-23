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

    // Checked against a hashed set. The IN (...) list of thousands of keys
    // would be scanned linearly for every joined row before Postgres 14.
    const isOneOf = (
      column: Fragment,
      values: readonly string[]
    ): Fragment => sql`
      ${column} IN (
        SELECT
          unnest(${values}::VARCHAR[])
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
          requester_number AS MATERIALIZED (
            SELECT
              hash
            FROM
              users
            WHERE
              public_key = ${hash.ownerPublicKey}
          ),
          my_contact AS MATERIALIZED (
            SELECT
              my_contact.hash_to
            FROM
              user_contact AS my_contact
            WHERE
              ${sql.and([
          sql`my_contact.hash_from = ${hash.ownerHash}`,
          // The number may belong to another account by now
          sql`
            ${hash.ownerHash} IN (
              SELECT
                hash
              FROM
                requester_number
            )
          `,
          createIsAllowedSharedContactHashFragment({
            hashColumn: sql`my_contact.hash_to`,
            publicImportCountThreshold: hash.publicImportCountThreshold,
            sql,
          }),
        ])}
          ),
          -- All rows, also those before the cursor, so a page lists every
          -- common friend of its keys
          shared_contact AS MATERIALIZED (
            SELECT
              other_side.public_key,
              other_side.public_key_v2,
              imported_my_contact.id,
              imported_my_contact.hash_to
            FROM
              my_contact
              INNER JOIN user_contact AS imported_my_contact ON imported_my_contact.hash_to = my_contact.hash_to
              INNER JOIN users AS other_side ON other_side.hash = imported_my_contact.hash_from
            WHERE
              ${sql.and([
          sql.or([
            isOneOf(sql`other_side.public_key`, hash.publicKeys),
            isOneOf(sql`other_side.public_key_v2`, hash.publicKeysV2),
          ]),
          sql`other_side.public_key != ${hash.ownerPublicKey}`,
        ])}
          ),
          page AS (
            SELECT
              public_key,
              public_key_v2,
              MAX(id) AS user_contact_id
            FROM
              shared_contact
            WHERE
              id > ${hash.userContactId}
            GROUP BY
              public_key,
              public_key_v2
            ORDER BY
              user_contact_id ASC
            LIMIT
              ${hash.limit}
          ),
          common_friend AS (
            SELECT DISTINCT
              page.user_contact_id,
              page.public_key,
              page.public_key_v2,
              shared_contact.hash_to
            FROM
              page
              INNER JOIN shared_contact ON shared_contact.public_key = page.public_key
              AND shared_contact.public_key_v2 IS NOT DISTINCT FROM page.public_key_v2
          ),
          saved_requester AS MATERIALIZED (
            SELECT
              saved.hash_from
            FROM
              requester_number
              INNER JOIN user_contact AS saved ON saved.hash_to = requester_number.hash
          )
        SELECT
          user_contact_id,
          public_key,
          public_key_v2,
          array_agg(
            hash_to
            ORDER BY
              hash_to
          ) AS common_friends,
          COALESCE(
            array_agg(
              hash_to
              ORDER BY
                hash_to
            ) FILTER (
              WHERE
                hash_to IN (
                  SELECT
                    hash_from
                  FROM
                    saved_requester
                )
                AND EXISTS (
                  SELECT
                    1
                  FROM
                    users AS other_number
                    INNER JOIN user_contact AS saved ON saved.hash_to = other_number.hash
                  WHERE
                    other_number.public_key = common_friend.public_key
                    AND saved.hash_from = common_friend.hash_to
                )
            ),
            ARRAY[]::VARCHAR[]
          ) AS verified_friends
        FROM
          common_friend
        GROUP BY
          user_contact_id,
          public_key,
          public_key_v2
        ORDER BY
          user_contact_id ASC
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
