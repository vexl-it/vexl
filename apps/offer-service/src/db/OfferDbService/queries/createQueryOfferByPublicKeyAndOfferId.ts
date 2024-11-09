import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
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
  userPublicKey: PublicKeyPemBase64E,
  id: OfferIdE,
  skipValidation: Schema.optional(Schema.Boolean),
})
export type QueryOfferByPublicKeyAndOfferIdRequest = Schema.Schema.Type<
  typeof QueryOfferByPublicKeyAndOfferIdRequest
>

export const createQueryOfferByPublicKeyAndOfferId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const QueryOfferByPublicKeyAndOfferId = yield* _(
    SqlResolver.grouped('QueryOfferByPublicKeyAndOfferId', {
      Request: QueryOfferByPublicKeyAndOfferIdRequest,
      RequestGroupKey: (req) => `${req.userPublicKey}:${req.id}`,
      Result: OfferSelectToOfferParts,
      ResultGroupKey: (result) =>
        `${result.privatePart.userPublicKey}:${result.publicPart.offerId}`,
      execute: (query) => {
        return sql`
          SELECT
            ${offerSelect(sql)}
          FROM
            offer_public
            INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.or(
            Array.map(query, (one) =>
              sql.and([
                sql`offer_public.offer_id = ${one.id}`,
                sql`offer_private.user_public_key = ${one.userPublicKey}`,
                one.skipValidation
                  ? 'true'
                  : offerNotExpired(sql, expirationPeriodDays),
                one.skipValidation
                  ? 'true'
                  : offerNotFlagged(sql, offerReportFilter),
              ])
            )
          )}
        `
      },
    })
  )
  return flow(
    QueryOfferByPublicKeyAndOfferId.execute,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offer by public key and offer id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
