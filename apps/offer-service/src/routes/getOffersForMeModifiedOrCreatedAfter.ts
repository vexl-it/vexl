import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getOffersForMeModifiedOrCreatedAfter = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getOffersForMeModifiedOrCreatedAfter',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDbService = yield* _(OfferDbService)

      const offers = yield* _(
        offerDbService.queryOffersForUser({
          modifiedAt: new Date(req.urlParams.modifiedAt),
          userPublicKey: security['public-key'],
        }),
        Effect.map(Array.map(offerPartsToServerOffer))
      )
      return {
        offers,
      }
    }).pipe(makeEndpointEffect)
)
