import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {RefreshOfferEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'

export const refreshOffer = Handler.make(RefreshOfferEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const offerDbService = yield* _(OfferDbService)

      const hashedIds = yield* _(Effect.forEach(req.body.adminIds, hashAdminId))

      const offersForAdminIds = yield* _(
        Effect.forEach(hashedIds, offerDbService.queryPublicPartByAdminId, {
          batching: true,
        })
      )

      if (Array.some(offersForAdminIds, Option.isNone)) {
        return yield* _(Effect.fail(new NotFoundError()))
      }

      return yield* _(
        Effect.forEach(hashedIds, offerDbService.updateRefreshOffer, {
          batching: true,
        })
      )
    }),
    Schema.Void
  )
)
