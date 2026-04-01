import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {
  decodePaginatedOfferNextPageToken,
  encodePaginatedOfferNextPageToken,
} from './utils/paginatedOfferNextPageToken'

export const getOffersForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'root',
    'getOffersForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        const security = yield* _(CurrentSecurity)
        const offerDbService = yield* _(OfferDbService)

        // + 1 so we know if there is a next page
        const increasedLimit = req.urlParams.limit + 1
        const {lastOfferChangeCounter, lastPrivatePartId} = yield* _(
          decodePaginatedOfferNextPageToken({
            nextPageToken: req.urlParams.nextPageToken,
          })
        )

        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            userPublicKey: security.publicKey,
            userPublicKeyV2: security.publicKeyV2,
            lastOfferChangeCounter,
            lastPrivatePartId,
            limit: increasedLimit,
          })
        )

        const isThereNextPage = offers.length === increasedLimit
        const offersToReturn = Array.take(req.urlParams.limit)(offers)
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
          limit: req.urlParams.limit,
          items: Array.map(offerPartsToServerOffer)(offersToReturn),
        }
      }).pipe(makeEndpointEffect)
  )
