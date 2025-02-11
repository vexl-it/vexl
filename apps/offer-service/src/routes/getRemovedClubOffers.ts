import {GetRemovedClubOffersEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {InvalidChallengeError} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedClubOffers = Handler.make(
  GetRemovedClubOffersEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const offerDbService = yield* _(OfferDbService)

        const existingIds = yield* _(
          offerDbService.queryOffersIds(req.body.publicKey)
        )

        const nonExistingIds = Array.filter(
          req.body.offerIds,
          (id) => !Array.contains(existingIds, id)
        )

        return {offerIds: nonExistingIds}
      }),
      InvalidChallengeError
    )
)
