import {RefreshOfferEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
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

      const existingHashedIds = pipe(
        Array.intersection(
          Array.getSomes(offersForAdminIds).map((record) => record.adminId)
        )(hashedIds)
      )

      return yield* _(
        Effect.forEach(existingHashedIds, offerDbService.updateRefreshOffer, {
          batching: true,
        })
      )
    }),
    Schema.Void
  )
)
