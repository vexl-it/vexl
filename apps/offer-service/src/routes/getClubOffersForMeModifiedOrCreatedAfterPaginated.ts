import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {
  decodePaginatedOfferNextPageToken,
  encodePaginatedOfferNextPageToken,
} from './utils/paginatedOfferNextPageToken'

export const getClubOffersForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'root',
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.payload))

        const offerDbService = yield* _(OfferDbService)
        const {lastOfferChangeCounter, lastPrivatePartId} = yield* _(
          decodePaginatedOfferNextPageToken({
            nextPageToken: req.payload.nextPageToken,
          })
        )

        // + 1 so we know if there is a next page
        const limit = req.payload.limit + 1
        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            userPublicKey: req.payload.publicKey,
            userPublicKeyV2: req.payload.publicKeyV2,
            lastOfferChangeCounter,
            lastPrivatePartId,
            limit,
          })
        )

        const isThereNextPage = offers.length === limit
        const offersToReturn = Array.take(req.payload.limit)(offers)
        const lastElementOfThisPage = Array.last(offersToReturn)
        const nextPageToken = Option.isSome(lastElementOfThisPage)
          ? yield* _(
              encodePaginatedOfferNextPageToken({
                offer: lastElementOfThisPage.value,
              })
            )
          : null

        return {
          nextPageToken,
          hasNext: isThereNextPage,
          limit: req.payload.limit,
          items: Array.map(offerPartsToServerOffer)(offersToReturn),
        }
      }).pipe(makeEndpointEffect)
  )
