import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, flow, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getOffersByIds = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getOffersByIds',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDbService = yield* _(OfferDbService)

      const queryRequest = Array.map(req.urlParams.ids, (id) => ({
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
    }).pipe(makeEndpointEffect)
)
