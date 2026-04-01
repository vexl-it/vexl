import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {mergeOffersPaginationPage} from './utils/mergeOffersPaginationPage'
import {
  decodeOffersPaginationNextPageToken,
  encodeOffersPaginationNextPageToken,
} from './utils/offersPaginationCursor'

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
        const currentCursor = yield* _(
          decodeOffersPaginationNextPageToken(req.urlParams.nextPageToken)
        )

        const {offersFetchedByPublicPartVersion, offersFetchedByPrivatePartId} =
          yield* _(
            Effect.all({
              offersFetchedByPublicPartVersion:
                offerDbService.queryOffersForUserByPublicPartVersionPaginated({
                  userPublicKey: security.publicKey,
                  userPublicKeyV2: security.publicKeyV2,
                  lastPublicPartVersion: currentCursor.lastPublicPartVersion,
                  limit: increasedLimit,
                }),
              offersFetchedByPrivatePartId:
                offerDbService.queryOffersForUserByPrivatePartIdPaginated({
                  userPublicKey: security.publicKey,
                  userPublicKeyV2: security.publicKeyV2,
                  lastPrivatePartId: currentCursor.lastPrivatePartId,
                  limit: increasedLimit,
                }),
            })
          )

        const {hasNext, items, nextCursor} = mergeOffersPaginationPage({
          offersFetchedByPublicPartVersion,
          offersFetchedByPrivatePartId,
          limit: req.urlParams.limit,
          currentCursor,
        })

        const nextPageToken = nextCursor
          ? yield* _(encodeOffersPaginationNextPageToken(nextCursor))
          : null

        return {
          nextPageToken,
          hasNext,
          limit: req.urlParams.limit,
          items: Array.map(items, offerPartsToServerOffer),
        }
      }).pipe(
        Effect.catchTag('ParseError', (e) =>
          Effect.fail(
            new InvalidNextPageTokenError({
              cause: e,
            })
          )
        ),
        makeEndpointEffect
      )
  )
