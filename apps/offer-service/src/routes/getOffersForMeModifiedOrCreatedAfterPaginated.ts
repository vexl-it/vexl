import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {GetOffersForMeNextPageToken} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, Schema} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

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
        const limit = req.urlParams.limit + 1
        const {lastPrivatePartId} = yield* _(
          base64UrlStringToDecoded({
            base64UrlString: req.urlParams.nextPageToken,
            decodeSchema: GetOffersForMeNextPageToken,
          })
        )

        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            modifiedAt: new Date(req.urlParams.modifiedAt),
            userPublicKey: security['public-key'],
            lastPrivatePartId,
            limit,
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )

        const isThereNextPage = offers.length === limit
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
          items: offers,
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
