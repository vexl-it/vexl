import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const FindFirstLevelContactsPublicKeysByHashFromPaginatedParams =
  Schema.Struct({
    hashFrom: ServerHashedNumber,
    userId: Schema.Int,
    limit: Schema.Int,
  })
export type FindFirstLevelContactsPublicKeysByHashFromPaginatedParams =
  typeof FindFirstLevelContactsPublicKeysByHashFromPaginatedParams.Type

export const FindFirstLevelContactsPublicKeysByHashFromPaginatedResult =
  Schema.Struct({
    publicKey: PublicKeyPemBase64,
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
          users.public_key
        FROM
          user_contact
          INNER JOIN users ON users.hash = user_contact.hash_to
        WHERE
          ${sql.and([
          sql`users.id > ${params.userId}`,
          sql`hash_from = ${params.hashFrom}`,
        ])}
        GROUP BY
          users.id,
          users.public_key
        ORDER BY
          users.id ASC
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
            'Error in findFirstLevelContactPublicKeysByHashFromPaginated  ',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'findFirstLevelContactPublicKeysByHashFromPaginated query'
      )
    )
  })
