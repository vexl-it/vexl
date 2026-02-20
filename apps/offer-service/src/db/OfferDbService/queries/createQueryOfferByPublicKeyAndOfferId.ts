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
import {
  offerNotExpired,
  offerNotFlagged,
  offerSelect,
  OfferSelectToOfferParts,
} from '../utils'

export const QueryOfferByPublicKeyAndOfferIdRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
  id: OfferId,
  skipValidation: Schema.optional(Schema.Boolean),
})
export type QueryOfferByPublicKeyAndOfferIdRequest =
  typeof QueryOfferByPublicKeyAndOfferIdRequest.Type

export const createQueryOfferByPublicKeyAndOfferId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryOfferByPublicKeyAndOfferIdRequest,
    Result: OfferSelectToOfferParts,
    execute: (params) => sql`
      SELECT
        ${offerSelect(sql)}
      FROM
        offer_public
        INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
      WHERE
        ${sql.and([
        sql`offer_public.offer_id = ${params.id}`,
        sql.or([
          sql`offer_private.user_public_key = ${params.userPublicKey}`,
          sql`
            offer_private.user_public_key = ${params.userPublicKeyV2 ??
            // This is important to avoid comparing the v2 public key with null in the database,
            // which would return all offers where the v2 public key is null
            // (which is all offers created before we introduced the v2 public key)
            'no-key'}
          `,
        ]),
        params.skipValidation
          ? 'true'
          : offerNotExpired(sql, expirationPeriodDays),
        params.skipValidation
          ? 'true'
          : offerNotFlagged(sql, offerReportFilter),
      ])}
    `,
  })
  return flow(
    query,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offer by public key and offer id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
