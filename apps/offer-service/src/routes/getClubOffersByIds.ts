import {GetClubOffersByIdsEndpint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {InvalidChallengeError} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, flow, Option} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getClubOffersByIds = Handler.make(
  GetClubOffersByIdsEndpint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const offerDbService = yield* _(OfferDbService)

        const queryRequest = Array.map(req.body.ids, (id) => ({
          id,
          userPublicKey: req.body.publicKey,
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
      InvalidChallengeError
    )
)
