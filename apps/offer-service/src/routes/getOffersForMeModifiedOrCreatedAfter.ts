import {Schema} from '@effect/schema'
import {GetOffersForMeModifiedOrCreatedAfterEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getOffersForMeModifiedOrCreatedAfter = Handler.make(
  GetOffersForMeModifiedOrCreatedAfterEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        const offers = yield* _(
          offerDbService.queryOffersForUser({
            modifiedAt: new Date(req.query.modifiedAt),
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
