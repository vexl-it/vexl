import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {
  expirationPeriodDaysConfig,
  offerReportFilterConfig,
} from '../../../configs'
import {PublicPartVersion} from '../domain'
import {
  offerNotExpired,
  offerNotFlagged,
  offerSelect,
  OfferSelectToOfferParts,
} from '../utils'

export const QueryOffersByPublicPartVersionPaginatedRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
  lastPublicPartVersion: PublicPartVersion,
  limit: Schema.Int,
})
export type QueryOffersByPublicPartVersionPaginatedRequest = Schema.Schema.Type<
  typeof QueryOffersByPublicPartVersionPaginatedRequest
>

export const createQueryOffersForUserByPublicPartVersionPaginated = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)
    const offerReportFilter = yield* _(offerReportFilterConfig)

    const query = SqlSchema.findAll({
      Request: QueryOffersByPublicPartVersionPaginatedRequest,
      Result: OfferSelectToOfferParts,
      execute: (params) => sql`
        SELECT
          ${offerSelect(sql)}
        FROM
          offer_public
          INNER JOIN offer_private ON offer_public.id = offer_private.offer_id
        WHERE
          ${sql.and([
          sql.or([
            sql`offer_private.user_public_key = ${params.userPublicKey}`,
            sql`
              offer_private.user_public_key = ${params.userPublicKeyV2 ??
              'no-key'}
            `,
          ]),
          sql`
            offer_public.public_part_version > ${params.lastPublicPartVersion}
          `,
          offerNotExpired(sql, expirationPeriodDays),
          offerNotFlagged(sql, offerReportFilter),
        ])}
        ORDER BY
          offer_public.public_part_version ASC
        LIMIT
          ${params.limit}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error querying offers by public-part version (paginated)',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
  }
)
