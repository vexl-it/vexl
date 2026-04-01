import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {mergeOffersPaginationPage} from './utils/mergeOffersPaginationPage'
import {
  decodeOffersPaginationNextPageToken,
  encodeOffersPaginationNextPageToken,
} from './utils/offersPaginationCursor'

export const getClubOffersForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'root',
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.payload))

        const offerDbService = yield* _(OfferDbService)
        const currentCursor = yield* _(
          decodeOffersPaginationNextPageToken(req.payload.nextPageToken)
        )

        // + 1 so we know if there is a next page
        const increasedLimit = req.payload.limit + 1
        const {offersFetchedByPublicPartVersion, offersFetchedByPrivatePartId} =
          yield* _(
            Effect.all({
              offersFetchedByPublicPartVersion:
                offerDbService.queryOffersForUserByPublicPartVersionPaginated({
                  userPublicKey: req.payload.publicKey,
                  userPublicKeyV2: req.payload.publicKeyV2,
                  lastPublicPartVersion: currentCursor.lastPublicPartVersion,
                  limit: increasedLimit,
                }),
              offersFetchedByPrivatePartId:
                offerDbService.queryOffersForUserByPrivatePartIdPaginated({
                  userPublicKey: req.payload.publicKey,
                  userPublicKeyV2: req.payload.publicKeyV2,
                  lastPrivatePartId: currentCursor.lastPrivatePartId,
                  limit: increasedLimit,
                }),
            })
          )

        const {hasNext, items, nextCursor} = mergeOffersPaginationPage({
          offersFetchedByPublicPartVersion,
          offersFetchedByPrivatePartId,
          limit: req.payload.limit,
          currentCursor,
        })

        const nextPageToken = nextCursor
          ? yield* _(encodeOffersPaginationNextPageToken(nextCursor))
          : null

        return {
          nextPageToken,
          hasNext,
          limit: req.payload.limit,
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
