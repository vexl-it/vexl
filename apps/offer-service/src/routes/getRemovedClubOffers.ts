import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedClubOffers = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getRemovedClubOffers',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const offerDbService = yield* _(OfferDbService)

      const existingIds = yield* _(
        offerDbService.queryOffersIds({
          userPublicKey: req.payload.publicKey,
          userPublicKeyV2: req.payload.publicKeyV2,
        })
      )

      const nonExistingIds = Array.filter(
        req.payload.offerIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {offerIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
