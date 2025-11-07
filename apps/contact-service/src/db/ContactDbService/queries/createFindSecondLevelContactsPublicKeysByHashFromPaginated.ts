import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const FindSecondLevelContactsPublicKeysByHashFromPaginatedParams =
  Schema.Struct({
    hashFrom: ServerHashedNumber,
    userId: Schema.Int,
    limit: Schema.Int,
  })
export type FindSecondLevelContactsPublicKeysByHashFromPaginatedParams =
  typeof FindSecondLevelContactsPublicKeysByHashFromPaginatedParams.Type

export const FindSecondLevelContactsPublicKeysByHashFromPaginatedResult =
  Schema.Struct({
    publicKey: PublicKeyPemBase64E,
    userId: Schema.NumberFromString,
  })
export type FindSecondLevelContactsPublicKeysByHashFromPaginatedResult =
  typeof FindSecondLevelContactsPublicKeysByHashFromPaginatedResult.Type

export const createFindSecondLevelContactsPublicKeysByHashFromPaginated =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindSecondLevelContactsPublicKeysByHashFromPaginatedParams,
      Result: FindSecondLevelContactsPublicKeysByHashFromPaginatedResult,
      execute: (params) => sql`
        SELECT DISTINCT
          MAX(their_contacts.id) AS user_id,
          second_lvl_friend.public_key
        FROM
          user_contact my_contacts
          INNER JOIN user_contact their_contacts ON my_contacts.hash_to = their_contacts.hash_to
          INNER JOIN users second_lvl_friend ON their_contacts.hash_from = second_lvl_friend.hash
        WHERE
          ${sql.and([
          sql`their_contacts.id > ${params.userId}`,
          sql`my_contacts.hash_from = ${params.hashFrom}`,
          sql`second_lvl_friend.hash != ${params.hashFrom}`,
        ])}
        GROUP BY
          second_lvl_friend.public_key
        ORDER BY
          MAX(their_contacts.id) ASC
        LIMIT
          ${params.limit}
      `,
    })

    return flow(
      query,
      Effect.map(
        Array.map((e) => ({publicKey: e.publicKey, userId: e.userId}))
      ),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findSecondLevelContactPublicKeysByHashFromPaginated',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'findSecondLevelContactPublicKeysByHashFromPaginated query'
      )
    )
  })
