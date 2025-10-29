import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuidE, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {OfferInfoE} from '@vexl-next/domain/src/general/offers'
import {type Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
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
  expectedClubUuid: ClubUuidE,
  receivedClubUuid: ClubUuidE,
  offerInfo: OfferInfoE,
}) {}

const validateOfferIsForClub =
  (clubUuid: ClubUuid) => (offerInfo: OfferInfoE) => {
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

const fetchAllClubOffersForMeActionAtom = atom(
  null,
  (
    get,
    set,
    {
      offersApi,
      keyPair,
      lastPrivatePartIdBase64,
      clubUuid,
    }: {
      offersApi: OfferApi
      keyPair: PrivateKeyHolderE
      clubUuid: ClubUuid
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allOffers: ServerOffer[] = []
      let nextPageToken = lastPrivatePartIdBase64
      let hasMore = true

      while (hasMore) {
        const response = yield* _(
          offersApi.getClubOffersForMeModifiedOrCreatedAfterPaginated({
            nextPageToken,
            limit: OFFERS_PAGE_LIMIT,
            keyPair,
          })
        )

        allOffers.push(...response.items)

        hasMore = response.hasNext
        if (response.nextPageToken) nextPageToken = response.nextPageToken
      }

      set(clubOffersNextPageParamAtom, Record.set(clubUuid, nextPageToken))

      return allOffers
    })
  }
)

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
      keyPair: PrivateKeyHolderE
      clubUuid: ClubUuid
      lastPrivatePartIdBase64?: Base64String
    }
  ) => {
    return Effect.gen(function* (_) {
      const allClubOffersForMe = yield* _(
        set(fetchAllClubOffersForMeActionAtom, {
          offersApi,
          lastPrivatePartIdBase64,
          keyPair,
          clubUuid,
        })
      )

      return yield* _(
        allClubOffersForMe,
        Array.map(
          flow(
            decryptOffer(keyPair),
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
