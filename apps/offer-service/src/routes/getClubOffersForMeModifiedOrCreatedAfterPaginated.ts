import {HttpApiBuilder} from '@effect/platform/index'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, Option, Schema} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'

const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(PrivatePartRecordId)('0')

export const GetClubOffersForMeNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})
export type GetClubOffersForMeNextPageToken =
  typeof GetClubOffersForMeNextPageToken.Type

export const getClubOffersForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'root',
    'getClubOffersForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.payload))

        const offerDbService = yield* _(OfferDbService)
        const {lastPrivatePartId} = req.payload.nextPageToken
          ? yield* _(
              base64UrlStringToDecoded({
                base64UrlString: req.payload.nextPageToken,
                decodeSchema: GetClubOffersForMeNextPageToken,
              })
            )
          : {lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID}

        // + 1 so we know if there is a next page
        const limit = req.payload.limit + 1
        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
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
                schema: GetClubOffersForMeNextPageToken,
              })
            )
          : null

        return {
          nextPageToken,
          hasNext: isThereNextPage,
          limit: req.payload.limit,
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
