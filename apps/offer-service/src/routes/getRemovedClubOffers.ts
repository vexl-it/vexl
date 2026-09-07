import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedClubOffers = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'getRemovedClubOffers',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const offerDbService = yield* OfferDbService

      const existingIds = yield* offerDbService.queryOffersIds({
        userPublicKey: req.payload.publicKey,
        userPublicKeyV2: req.payload.publicKeyV2,
      })

      const nonExistingIds = Array.filter(
        req.payload.offerIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {offerIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
