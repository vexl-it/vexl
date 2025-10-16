import {GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, Schema} from 'effect'
import {ApiEndpoint, Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {retrieveServerUrl} from '../utils/retrieveServerUrl'

export const getOffersForMeModifiedOrCreatedAfterPaginated = Handler.make(
  GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const serverUrl = yield* _(retrieveServerUrl())
        const endpointUrl = ApiEndpoint.getPath(
          GetOffersForMeModifiedOrCreatedAfterPaginatedEndpoint
        )
        const offerDbService = yield* _(OfferDbService)

        // + 1 so we know if there is a next page
        const limit = req.query.limit + 1
        const offers = yield* _(
          offerDbService.queryOffersForUserPaginated({
            modifiedAt: new Date(req.query.modifiedAt),
            userPublicKey: security['public-key'],
            lastPrivatePartId: req.query.lastPrivatePartId,
            limit,
          }),
          Effect.map(Array.map(offerPartsToServerOffer))
        )

        const isThereNextPage = offers.length === limit
        const offersToReturn = Array.take(req.query.limit)(offers)
        const lastElementOfThisPage = isThereNextPage
          ? Array.last(offersToReturn)
          : Option.none()
        const nextLink = Option.isSome(lastElementOfThisPage)
          ? (() => {
              const url = new URL(endpointUrl, serverUrl)
              url.searchParams.set('modifiedAt', req.query.modifiedAt)
              url.searchParams.set('limit', req.query.limit.toString())
              url.searchParams.set(
                'lastPrivatePartId',
                lastElementOfThisPage.value.id.toString()
              )
              return url
            })()
          : null

        return {
          nextLink,
          prevLink: null,
          hasNext: isThereNextPage,
          hasPrev: false,
          limit: req.query.limit,
          items: offers,
        }
      }),
      Schema.Void
    )
)
