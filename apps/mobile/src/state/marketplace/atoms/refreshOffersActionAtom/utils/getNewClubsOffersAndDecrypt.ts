import {
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, Record, Schema} from 'effect'
import {atom} from 'jotai'
import {clubOffersNextPageParamAtom} from '../../offersState'

const OFFERS_PAGE_LIMIT = 30

export type ApiErrorFetchingClubsOffers = Effect.Effect.Error<
  ReturnType<OfferApi['getClubOffersForMeModifiedOrCreatedAfter']>
>

export class NotOfferForExpectedClubError extends Schema.TaggedError<NotOfferForExpectedClubError>(
  'NotOfferForExpectedClubError'
)('NotOfferForExpectedClubError', {
  expectedClubUuid: ClubUuid,
  receivedClubUuid: ClubUuid,
  offerInfo: OfferInfo,
}) {}

const validateOfferIsForClub =
  (clubUuid: ClubUuid) => (offerInfo: OfferInfo) => {
    const offerClubIds = offerInfo.privatePart.clubIds
    const friendLevel = offerInfo.privatePart.friendLevel
    const commonFriends = offerInfo.privatePart.commonFriends

    return (
      offerClubIds.length === 1 &&
      offerClubIds[0] === clubUuid &&
      friendLevel.length === 1 &&
      friendLevel[0] === 'CLUB' &&
      commonFriends.length === 0
    )
  }

export const getNewClubsOffersAndDecryptPaginatedActionAtom = atom(
  null,
  (
    get,
    set,
    {
      offersApi,
      keyPair,
      clubUuid,
      lastPrivatePartIdBase64,
    }: {
      offersApi: OfferApi
      keyPair: PrivateKeyHolder
      clubUuid: ClubUuid
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allClubOffersForMe = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            offersApi.getClubOffersForMeModifiedOrCreatedAfterPaginated({
              nextPageToken: nextPageToken ?? lastPrivatePartIdBase64,
              limit: OFFERS_PAGE_LIMIT,
              keyPair,
            }),
          storeNextPageToken: (nextPageToken) => {
            if (!nextPageToken) return

            set(
              clubOffersNextPageParamAtom,
              Record.set(clubUuid, nextPageToken)
            )
          },
        })
      )

      return yield* _(
        allClubOffersForMe,
        Array.map(
          flow(
            decryptOffer(
              keyPair,
              // TODO(new-keys) pass a correct key when having new keys in storage
              {} as KeyPairV2
            ),
            Effect.filterOrFail(
              validateOfferIsForClub(clubUuid),
              (offerInfo) =>
                new NotOfferForExpectedClubError({
                  expectedClubUuid: clubUuid,
                  receivedClubUuid: clubUuid,
                  offerInfo,
                })
            )
          )
        ),
        Array.map(Effect.either),
        Effect.all
      )
    })
  }
)
