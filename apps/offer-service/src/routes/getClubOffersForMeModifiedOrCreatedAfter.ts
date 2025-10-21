import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getClubOffersForMeModifiedOrCreatedAfter = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getClubOffersForMeModifiedOrCreatedAfter',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const offerDbService = yield* _(OfferDbService)

      const offers = yield* _(
        offerDbService.queryOffersForUser({
          modifiedAt: new Date(req.payload.modifiedAt),
          userPublicKey: req.payload.publicKey,
        }),
        Effect.map(Array.map(offerPartsToServerOffer))
      )
      return {
        offers,
      }
    }).pipe(makeEndpointEffect)
)
