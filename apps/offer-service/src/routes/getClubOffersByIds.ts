import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, flow, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getClubOffersByIds = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getClubOffersByIds',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const offerDbService = yield* _(OfferDbService)

      const queryRequest = Array.map(req.payload.ids, (id) => ({
        id,
        userPublicKey: req.payload.publicKey,
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
