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

export const createUpdateReportOffer = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient
  const expirationPeriodDays = yield* expirationPeriodDaysConfig

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
    `.pipe(UnexpectedServerError.wrapErrors('Error updaing report offer'))
})
