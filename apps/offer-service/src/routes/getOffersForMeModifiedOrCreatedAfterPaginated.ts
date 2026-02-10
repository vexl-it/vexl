import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, Schema} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(PrivatePartRecordId)('0')

export const GetOffersForMeNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})
export type GetOffersForMeNextPageToken =
  typeof GetOffersForMeNextPageToken.Type

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
        const {lastPrivatePartId} = req.urlParams.nextPageToken
          ? yield* _(
              base64UrlStringToDecoded({
                base64UrlString: req.urlParams.nextPageToken,
                decodeSchema: GetOffersForMeNextPageToken,
              })
            )
          : {lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID}

        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            userPublicKey: security.publicKey,
            lastPrivatePartId,
            limit: increasedLimit,
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )

        const isThereNextPage = offers.length === increasedLimit
        const offersToReturn = Array.take(req.urlParams.limit)(offers)
        const lastElementOfThisPage = Array.last(offersToReturn)
        const nextPageToken = Option.isSome(lastElementOfThisPage)
          ? yield* _(
              objectToBase64UrlEncoded({
                object: {
                  lastPrivatePartId: Schema.decodeSync(PrivatePartRecordId)(
                    lastElementOfThisPage.value.id.toString()
                  ),
                },
                schema: GetOffersForMeNextPageToken,
              })
            )
          : null

        return {
          nextPageToken,
          hasNext: isThereNextPage,
          limit: req.urlParams.limit,
          items: offersToReturn,
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
