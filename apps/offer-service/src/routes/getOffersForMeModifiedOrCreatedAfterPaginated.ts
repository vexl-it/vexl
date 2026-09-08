import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, Option} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {
  decodePaginatedOfferNextPageToken,
  encodePaginatedOfferNextPageToken,
} from './utils/paginatedOfferNextPageToken'

export const getOffersForMeModifiedOrCreatedAfterPaginated = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'getOffersForMeModifiedOrCreatedAfterPaginated',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const offerDbService = yield* OfferDbService

      // + 1 so we know if there is a next page
      const increasedLimit = req.query.limit + 1
      const {lastOfferChangeCounter, lastPrivatePartId} =
        yield* decodePaginatedOfferNextPageToken({
          nextPageToken: req.query.nextPageToken,
        })

      const offers = yield* offerDbService.queryOffersForUserPaginated({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
        lastOfferChangeCounter,
        lastPrivatePartId,
        limit: increasedLimit,
      })

      const isThereNextPage = offers.length === increasedLimit
      const offersToReturn = Array.take(req.query.limit)(offers)
      const lastElementOfThisPage = Array.last(offersToReturn)
      const nextPageToken = Option.isSome(lastElementOfThisPage)
        ? yield* encodePaginatedOfferNextPageToken({
            offer: lastElementOfThisPage.value,
          })
        : null

      return {
        nextPageToken,
        hasNext: isThereNextPage,
        limit: req.query.limit,
        items: Array.map(offerPartsToServerOffer)(offersToReturn),
      }
    }).pipe(makeEndpointEffect)
)
