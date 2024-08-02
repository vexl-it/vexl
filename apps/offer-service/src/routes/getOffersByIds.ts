import {Schema} from '@effect/schema'
import {GetOffersByIdsEndpint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, flow, Option} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getOffersByIds = Handler.make(
  GetOffersByIdsEndpint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        const queryRequest = Array.map(req.query.ids, (id) => ({
          id,
          userPublicKey: security['public-key'],
        }))

        const offers = yield* _(
          Effect.forEach(
            queryRequest,
            offerDbService.queryOfferByPublicKeyAndOfferId,
            {batching: true}
          ),
          Effect.map(
            flow(
              Array.filter(Option.isSome),
              Array.map((a) => a.value)
            )
          )
        )

        return Array.map(offers, offerPartsToServerOffer)
      }),
      Schema.Void
    )
)
