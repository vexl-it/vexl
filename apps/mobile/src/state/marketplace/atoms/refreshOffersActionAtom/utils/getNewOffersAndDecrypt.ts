import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  type FriendLevel,
  type OfferInfo,
} from '@vexl-next/domain/src/general/offers'
import {type Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow} from 'effect'
import {atom} from 'jotai'
import {NotOfferFromContactNetworkError} from '../../../domain'
import {contactOffersNextPageParamAtom} from '../../offersState'

const OFFERS_PAGE_LIMIT = 30

const validateOfferIsFromContactNetwork = (offerInfo: OfferInfo): boolean => {
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
      keyPair: PrivateKeyHolder
      /**
       * Only offers with ids that were not previously fetched will be fetched.
       */
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allOffers = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            offersApi.getOffersForMeModifiedOrCreatedAfterPaginated({
              nextPageToken: nextPageToken ?? lastPrivatePartIdBase64,
              limit: OFFERS_PAGE_LIMIT,
            }),
          storeNextPageToken: (nextPageToken) => {
            set(contactOffersNextPageParamAtom, nextPageToken)
          },
        })
      )

      return yield* _(
        allOffers,
        Array.map(
          flow(
            decryptOffer(
              keyPair,
              // TODO(new-keys) pass a correct key when having new keys in storage
              {} as KeyPairV2
            ),
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
