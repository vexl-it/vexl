import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
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

export const QueryOffersPaginatedRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  lastPrivatePartId: PrivatePartRecordId,
  limit: Schema.Int,
})
export type QueryOffersPaginatedRequest = Schema.Schema.Type<
  typeof QueryOffersPaginatedRequest
>

export const createQueryOffersForUserPaginated = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
  const offerReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryOffersPaginatedRequest,
    Result: OfferSelectToOfferParts,
    execute: (params) => sql`
      SELECT
        ${offerSelect(sql)}
      FROM
        offer_public
        INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
      WHERE
        ${sql.and([
        sql`offer_private.user_public_key = ${params.userPublicKey}`,
        sql`offer_private.id > ${params.lastPrivatePartId}`,
        offerNotExpired(sql, expirationPeriodDays),
        offerNotFlagged(sql, offerReportFilter),
      ])}
      ORDER BY
        offer_private.id ASC
      LIMIT
        ${params.limit}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offers for user (paginated)', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
