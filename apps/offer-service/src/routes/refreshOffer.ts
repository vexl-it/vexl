import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, pipe} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'

export const refreshOffer = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'refreshOffer',
  (req) =>
    Effect.gen(function* () {
      const offerDbService = yield* OfferDbService

      const hashedIds = yield* Effect.forEach(req.payload.adminIds, hashAdminId)

      const offersForAdminIds = yield* Effect.forEach(
        hashedIds,
        offerDbService.queryPublicPartByAdminId,
        {}
      )

      const existingHashedIds = pipe(
        Array.intersection(
          Array.getSomes(offersForAdminIds).map((record) => record.adminId)
        )(hashedIds)
      )

      return yield* Effect.forEach(
        existingHashedIds,
        offerDbService.updateRefreshOffer,
        {}
      )
    }).pipe(makeEndpointEffect)
)
