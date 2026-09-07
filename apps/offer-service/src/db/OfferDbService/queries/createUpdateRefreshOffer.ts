import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {OfferAdminIdHashed} from '../domain'

export const UpdateRefreshOfferRequest = OfferAdminIdHashed
export type UpdateRefreshOfferRequest = typeof UpdateRefreshOfferRequest.Type

export const createUpdateRefreshOffer = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const UpdateRefreshOffer = SqlResolver.ordered({
    Request: UpdateRefreshOfferRequest,
    Result: Schema.Struct({offerId: OfferId}),
    execute: (adminIds) => {
      return sql`
        UPDATE offer_public
        SET
          refreshed_at = now()
        WHERE
          ${sql.in('admin_id', adminIds)}
        RETURNING
          offer_id
      `
    },
  })

  return flow(
    SqlResolver.request(UpdateRefreshOffer),
    Effect.map((a) => a.offerId),
    UnexpectedServerError.wrapErrors('Error refreshing offers user')
  )
})
