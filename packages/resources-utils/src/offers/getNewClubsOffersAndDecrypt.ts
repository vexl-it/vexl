import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuidE, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {OfferInfoE} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, Schema, type Either} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

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

export default function getNewClubsOffersAndDecrypt({
  offersApi,
  keyPair,
  clubUuid,
  modifiedAt,
}: {
  /**
   * Offers API instance. Already handles auth for us.
   */
  offersApi: OfferApi
  /**
   * KeyPair to decrypt offers with.
   */
  keyPair: PrivateKeyHolderE
  clubUuid: ClubUuid
  /**
   * Only offers modified/created after this date will be fetched.
   */
  modifiedAt: IsoDatetimeStringE
}): Effect.Effect<
  Array<
    Either.Either<
      OfferInfoE,
      | DecryptingOfferError
      | NonCompatibleOfferVersionError
      | NotOfferForExpectedClubError
    >
  >,
  ApiErrorFetchingClubsOffers | CryptoError
> {
  return Effect.gen(function* (_) {
    return yield* _(
      offersApi
        .getClubOffersForMeModifiedOrCreatedAfter({
          modifiedAt,
          keyPair,
        })
        .pipe(
          Effect.map(({offers}) => offers),
          Effect.flatMap(
            flow(
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
          )
        )
    )
  })
}
