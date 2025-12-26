import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, flow, Schema} from 'effect'
import {
  expirationPeriodDaysConfig,
  offerReportFilterConfig,
} from '../../../configs'
import {offerNotExpired, offerNotFlagged} from '../utils'

export const createQueryOfferIdsForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const QueryOffers = yield* _(
    SqlResolver.grouped('QueryOfferIds', {
      Request: PublicKeyPemBase64,
      RequestGroupKey: (userPublicKey) => userPublicKey,
      Result: Schema.Struct({
        offerId: OfferId,
        userPublicKey: PublicKeyPemBase64,
      }),
      ResultGroupKey: (result) => result.userPublicKey,
      execute: (query) => {
        return sql`
          SELECT
            offer_public.offer_id AS offer_id,
            user_public_key
          FROM
            offer_public
            INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.or(
            Array.map(query, (publicKey) =>
              sql.and([
                sql`user_public_key = ${publicKey}`,
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
    Effect.map(Array.map((a) => a.offerId)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offer ids for user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
