import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, flow, Schema} from 'effect'
import {
  expirationPeriodDaysConfig,
  offerReportFilterConfig,
} from '../../../configs'
import {offerNotExpired, offerNotFlagged} from '../utils'

export const QueryOfferIdsForUserRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
})
export type QueryOfferIdsForUserRequest = Schema.Schema.Type<
  typeof QueryOfferIdsForUserRequest
>

export const createQueryOfferIdsForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryOfferIdsForUserRequest,
    Result: Schema.Struct({
      offerId: OfferId,
    }),
    execute: (params) => {
      return sql`
        SELECT
          offer_public.offer_id AS offer_id
        FROM
          offer_public
          INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
        WHERE
          ${sql.and([
          sql.or([
            sql`user_public_key = ${params.userPublicKey}`,
            sql`
              user_public_key = ${params.userPublicKeyV2 ??
              // This is important to avoid comparing the v2 public key with null in the database,
              // which would return all offers where the v2 public key is null
              // (which is all offers created before we introduced the v2 public key)
              'no-key'}
            `,
          ]),
          offerNotExpired(sql, expirationPeriodDays),
          offerNotFlagged(sql, offerReportFilter),
        ])}
      `
    },
  })

  return flow(
    query,
    Effect.map(Array.map((a) => a.offerId)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offer ids for user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
