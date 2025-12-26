import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect, Schema} from 'effect'
import {expirationPeriodDaysConfig} from '../../../configs'
import {offerNotExpired} from '../utils'

export const UpdateReportOfferRequest = Schema.Struct({
  offerId: OfferId,
  userPublicKey: PublicKeyPemBase64,
})
export type UpdateReportOfferRequest = typeof UpdateReportOfferRequest.Type

export const createUpdateReportOffer = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const expirationPeriodDays = yield* _(expirationPeriodDaysConfig)

  return (user: UpdateReportOfferRequest) =>
    sql`
      UPDATE offer_public
      SET
        report = report + 1
      WHERE
        ${sql.and([
        sql`offer_id = ${user.offerId}`,
        offerNotExpired(sql, expirationPeriodDays),
      ])}
    `.pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error updaing report offer', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
})
