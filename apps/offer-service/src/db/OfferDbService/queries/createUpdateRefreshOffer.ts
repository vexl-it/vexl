import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferId} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {OfferAdminIdHashed} from '../domain'

export const UpdateRefreshOfferRequest = OfferAdminIdHashed
export type UpdateRefreshOfferRequest = typeof UpdateRefreshOfferRequest.Type

export const createUpdateRefreshOffer = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const UpdateRefreshOffer = yield* _(
    SqlResolver.ordered('UpdateRefreshOffer', {
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
  )

  return flow(
    UpdateRefreshOffer.execute,
    Effect.map((a) => a.offerId),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error refreshing offers user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
