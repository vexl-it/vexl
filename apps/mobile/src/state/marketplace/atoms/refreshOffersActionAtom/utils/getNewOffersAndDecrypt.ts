import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  type FriendLevel,
  type OfferInfoE,
} from '@vexl-next/domain/src/general/offers'
import {type Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Array, Effect, flow} from 'effect'
import {atom} from 'jotai'
import {NotOfferFromContactNetworkError} from '../../../domain'
import {contactOffersNextPageParamAtom} from '../../offersState'

const OFFERS_PAGE_LIMIT = 30

const validateOfferIsFromContactNetwork = (offerInfo: OfferInfoE): boolean => {
  if (offerInfo.privatePart.adminId) return true

  const friendLevel = offerInfo.privatePart.friendLevel
  const clubIds = offerInfo.privatePart.clubIds
  const allowedFriendLevels: FriendLevel[] = ['FIRST_DEGREE', 'SECOND_DEGREE']

  return (
    friendLevel.length > 0 &&
    Array.difference(friendLevel, allowedFriendLevels).length === 0 &&
    Array.isEmptyReadonlyArray(clubIds)
  )
}

const fetchAllOffersForMeActionAtom = atom(
  null,
  (
    get,
    set,
    {
      offersApi,
      lastPrivatePartIdBase64,
    }: {
      offersApi: OfferApi
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allOffers: ServerOffer[] = []
      let nextPageToken = lastPrivatePartIdBase64
      let hasMore = true

      while (hasMore) {
        const response = yield* _(
          offersApi.getOffersForMeModifiedOrCreatedAfterPaginated({
            nextPageToken,
            limit: OFFERS_PAGE_LIMIT,
          })
        )

        allOffers.push(...response.items)

        hasMore = response.hasNext
        if (response.nextPageToken) {
          nextPageToken = response.nextPageToken
        }
      }

      set(contactOffersNextPageParamAtom, nextPageToken)

      return allOffers
    })
  }
)

export const getNewContactNetworkOffersAndDecryptPaginatedActionAtom = atom(
  null,
  (
    get,
    set,
    {
      offersApi,
      keyPair,
      lastPrivatePartIdBase64,
    }: {
      /**
       * Offers API instance. Already handles auth for us.
       */
      offersApi: OfferApi
      /**
       * KeyPair to decrypt offers with.
       */
      keyPair: PrivateKeyHolderE
      /**
       * Only offers with ids that were not previously fetched will be fetched.
       */
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allOffers = yield* _(
        set(fetchAllOffersForMeActionAtom, {
          offersApi,
          lastPrivatePartIdBase64,
        })
      )

      return yield* _(
        allOffers,
        Array.map(
          flow(
            decryptOffer(keyPair),
            Effect.filterOrFail(
              validateOfferIsFromContactNetwork,
              (offerInfo) => new NotOfferFromContactNetworkError({offerInfo})
            )
          )
        ),
        Array.map(Effect.either),
        Effect.all
      )
    })
  }
)
