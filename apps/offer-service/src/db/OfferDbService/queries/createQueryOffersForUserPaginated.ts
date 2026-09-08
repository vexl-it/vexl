import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {
  expirationPeriodDaysConfig,
  offerReportFilterConfig,
} from '../../../configs'
import {OfferChangeCounter} from '../domain'
import {
  offerNotExpired,
  offerNotFlagged,
  offerSelect,
  OfferSelectWithOfferForUserUpdateCounterToOfferParts,
} from '../utils'

export const QueryOffersPaginatedRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.OptionFromOptional(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  lastOfferChangeCounter: OfferChangeCounter,
  lastPrivatePartId: PrivatePartRecordId,
  limit: Schema.Int,
})
export type QueryOffersPaginatedRequest = Schema.Schema.Type<
  typeof QueryOffersPaginatedRequest
>

export const createQueryOffersForUserPaginated = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient
  const expirationPeriodDays = yield* expirationPeriodDaysConfig
  const offerReportFilter = yield* offerReportFilterConfig

  const query = SqlSchema.findAll({
    Request: QueryOffersPaginatedRequest,
    Result: OfferSelectWithOfferForUserUpdateCounterToOfferParts,
    execute: (params) => sql`
      SELECT
        *
      FROM
        (
          SELECT
            ${offerSelect(sql)},
            GREATEST(
              offer_public.update_counter,
              offer_private.update_counter
            ) AS offer_for_user_update_counter
          FROM
            offer_public
            INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
          WHERE
            ${sql.and([
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
        offerNotExpired(sql, expirationPeriodDays),
        offerNotFlagged(sql, offerReportFilter),
      ])}
        ) offers_for_user
      WHERE
        ${sql.or([
        sql` offer_for_user_update_counter > ${params.lastOfferChangeCounter} `,
        sql.and([
          sql`
            offer_for_user_update_counter = ${params.lastOfferChangeCounter}
          `,
          sql`"offer_private.id" > ${params.lastPrivatePartId}`,
        ]),
      ])}
      ORDER BY
        offer_for_user_update_counter ASC,
        "offer_private.id" ASC
      LIMIT
        ${params.limit}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error querying offers for user (paginated)'
    )
  )
})
