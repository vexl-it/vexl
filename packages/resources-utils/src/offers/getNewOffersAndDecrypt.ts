import {type PrivateKeyHolderE} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  OfferInfoE,
  type FriendLevel,
} from '@vexl-next/domain/src/general/offers'
import {type IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, flow, Schema, type Either} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'

export type ApiErrorFetchingOffers = Effect.Effect.Error<
  ReturnType<OfferApi['getOffersForMeModifiedOrCreatedAfter']>
>

export class NotOfferFromContactNetworkError extends Schema.TaggedError<NotOfferFromContactNetworkError>(
  'NotOfferFromContactNetworkError'
)('NotOfferFromContactNetworkError', {
  offerInfo: OfferInfoE,
}) {}

const validateOfferIsFromContactNetwork = (offerInfo: OfferInfoE): boolean => {
  const friendLevel = offerInfo.privatePart.friendLevel
  const clubIds = offerInfo.privatePart.clubIds
  const allowedFriendLevels: FriendLevel[] = ['FIRST_DEGREE', 'SECOND_DEGREE']

  return (
    friendLevel.length > 0 &&
    Array.difference(friendLevel, allowedFriendLevels).length === 0 &&
    Array.isEmptyReadonlyArray(clubIds)
  )
}

/**
 * Downloads new offers from the server and decrypts them with provided keypair
 */
export default function getNewContactNetworkOffersAndDecrypt({
  offersApi,
  keyPair,
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
      | NotOfferFromContactNetworkError
    >
  >,
  ApiErrorFetchingOffers
> {
  return offersApi
    .getOffersForMeModifiedOrCreatedAfter({query: {modifiedAt}})
    .pipe(
      Effect.map(({offers}) => offers),
      Effect.flatMap(
        flow(
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
      )
    )
}
