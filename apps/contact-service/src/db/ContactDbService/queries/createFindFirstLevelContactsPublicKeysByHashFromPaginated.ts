import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'
import {createIsVisibleContactFragment} from '../../utils/createIsVisibleContactFragment'

export const FindFirstLevelContactsPublicKeysByHashFromPaginatedParams =
  Schema.Struct({
    hashFrom: ServerHashedNumber,
    userId: Schema.Int,
    limit: Schema.Int,
    activeWithinDays: Schema.Int,
    hideUsersWithoutPublicKeyV2: Schema.Boolean,
  })
export type FindFirstLevelContactsPublicKeysByHashFromPaginatedParams =
  typeof FindFirstLevelContactsPublicKeysByHashFromPaginatedParams.Type

export const FindFirstLevelContactsPublicKeysByHashFromPaginatedResult =
  Schema.Struct({
    publicKey: PublicKeyPemBase64,
    publicKeyV2: Schema.optionalWith(PublicKeyV2, {
      as: 'Option',
      nullable: true,
    }),
    userId: Schema.NumberFromString,
  })
export type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult =
  typeof FindFirstLevelContactsPublicKeysByHashFromPaginatedResult.Type

export const createFindFirstLevelContactsPublicKeysByHashFromPaginated =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindFirstLevelContactsPublicKeysByHashFromPaginatedParams,
      Result: FindFirstLevelContactsPublicKeysByHashFromPaginatedResult,
      execute: (params) => sql`
        SELECT
          users.id AS user_id,
          users.public_key,
          users.public_key_v2
        FROM
          user_contact
          INNER JOIN users ON users.hash = user_contact.hash_to
        WHERE
          ${sql.and([
          sql`users.id > ${params.userId}`,
          sql`hash_from = ${params.hashFrom}`,
          createIsVisibleContactFragment({
            usersTable: sql`users`,
            activeWithinDays: params.activeWithinDays,
            hideUsersWithoutPublicKeyV2: params.hideUsersWithoutPublicKeyV2,
            sql,
          }),
        ])}
        GROUP BY
          users.id,
          users.public_key,
          users.public_key_v2
        ORDER BY
          users.id ASC
        LIMIT
          ${params.limit}
      `,
    })

    return flow(
      query,
      Effect.map(
        Array.map((e) => ({
          publicKey: e.publicKey,
          publicKeyV2: e.publicKeyV2,
          userId: e.userId,
        }))
      ),
      UnexpectedServerError.wrapErrors(
        'Error in findFirstLevelContactPublicKeysByHashFromPaginated  '
      ),
      Effect.withSpan(
        'findFirstLevelContactPublicKeysByHashFromPaginated query'
      )
    )
  })
