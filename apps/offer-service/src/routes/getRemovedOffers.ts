import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedOffers = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getRemovedOffers',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDbService = yield* _(OfferDbService)

      const existingIds = yield* _(
        offerDbService.queryOffersIds(security.publicKey)
      )

      const nonExistingIds = Array.filter(
        req.payload.offerIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {offerIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
