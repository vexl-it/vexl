import {GetClubOffersForMeModifiedOrCreatedAfterEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {InvalidChallengeError} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getClubOffersForMeModifiedOrCreatedAfter = Handler.make(
  GetClubOffersForMeModifiedOrCreatedAfterEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const offerDbService = yield* _(OfferDbService)

        const offers = yield* _(
          offerDbService.queryOffersForUser({
            modifiedAt: new Date(req.body.modifiedAt),
            userPublicKey: req.body.publicKey,
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )
        return {
          offers,
        }
      }),
      InvalidChallengeError
    )
)
