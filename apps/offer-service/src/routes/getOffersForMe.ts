import {GetOffersForMeEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

const LOWEST_DATE = new Date(0)

export const getOffersForMe = Handler.make(
  GetOffersForMeEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        const offers = yield* _(
          offerDbService.queryOffersForUser({
            modifiedAt: LOWEST_DATE,
            userPublicKey: security['public-key'],
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )
        return {
          offers,
        }
      }),
      Schema.Void
    )
)
