import {Schema} from '@effect/schema'
import {GetRemovedOffersEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedOffers = Handler.make(
  GetRemovedOffersEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        const existingIds = yield* _(
          offerDbService.queryOffersIds(security['public-key'])
        )

        const nonExistingIds = Array.filter(
          req.body.offerIds,
          (id) => !Array.contains(existingIds, id)
        )

        return {offerIds: nonExistingIds}
      }),
      Schema.Void
    )
)
