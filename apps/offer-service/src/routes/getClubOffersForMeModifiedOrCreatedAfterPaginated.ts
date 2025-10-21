import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {GetOffersForMeNextPageToken} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, Option, Schema} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

export const getClubOffersForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'root',
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.payload))

        const offerDbService = yield* _(OfferDbService)
        const lastPrivatePartId = yield* _(
          base64UrlStringToDecoded({
            base64UrlString: req.payload.nextPageToken,
            decodeSchema: PrivatePartRecordId,
          })
        )

        // + 1 so we know if there is a next page
        const limit = req.payload.limit + 1
        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            modifiedAt: new Date(req.payload.modifiedAt),
            userPublicKey: req.payload.publicKey,
            lastPrivatePartId,
            limit,
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )

        const isThereNextPage = offers.length === limit
        const offersToReturn = Array.take(req.payload.limit)(offers)
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
          limit: req.payload.limit,
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
