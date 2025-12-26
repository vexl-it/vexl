import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
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

export const QueryOffersRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  modifiedAt: Schema.DateFromSelf,
})
export type QueryOffersRequest = Schema.Schema.Type<typeof QueryOffersRequest>

export const createQueryOffersForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const QueryOffers = yield* _(
    SqlResolver.grouped('QueryOffersForUser', {
      Request: QueryOffersRequest,
      RequestGroupKey: (userPublicKey) => userPublicKey.userPublicKey,
      Result: OfferSelectToOfferParts,
      ResultGroupKey: (result) => result.privatePart.userPublicKey,
      execute: (query) => {
        return sql`
          SELECT
            ${offerSelect(sql)}
          FROM
            offer_public
            INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.or(
            Array.map(query, (oneU) =>
              sql.and([
                sql`offer_private.user_public_key = ${oneU.userPublicKey}`,
                sql.or([
                  sql`offer_public.modified_at >= ${oneU.modifiedAt}::date`,
                  sql`offer_private.created_at >= ${oneU.modifiedAt}::date`,
                ]),
                offerNotExpired(sql, expirationPeriodDays),
                offerNotFlagged(sql, offerReportFilter),
              ])
            )
          )}
        `
      },
    })
  )
  return flow(
    QueryOffers.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offers for user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
