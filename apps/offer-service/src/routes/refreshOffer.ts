import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'

export const refreshOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'refreshOffer',
  (req) =>
    Effect.gen(function* (_) {
      const offerDbService = yield* _(OfferDbService)

      const hashedIds = yield* _(
        Effect.forEach(req.payload.adminIds, hashAdminId)
      )

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
    }).pipe(makeEndpointEffect)
)
