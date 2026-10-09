import {
  OfferInfo,
  type NearbyOfferKey,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Schema} from 'effect'
import decryptOffer, {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '../decryptOffer'
import {nearbyKeyToKeyPairE, type InvalidNearbyKeyError} from './nearbyKey'

export class NearbyOfferNotFoundError extends Schema.TaggedError<NearbyOfferNotFoundError>(
  'NearbyOfferNotFoundError'
)('NearbyOfferNotFoundError', {}) {}

export class NotNearbyOfferError extends Schema.TaggedError<NotNearbyOfferError>(
  'NotNearbyOfferError'
)('NotNearbyOfferError', {
  offerInfo: OfferInfo,
}) {}

const isNearbyOffer = ({
  privatePart: {friendLevel, clubIds, commonFriends},
}: OfferInfo): boolean =>
  friendLevel.length === 1 &&
  friendLevel[0] === 'NEARBY' &&
  !Array.isNonEmptyReadonlyArray(clubIds) &&
  !Array.isNonEmptyReadonlyArray(commonFriends)

export function fetchNearbyOffer({
  offerApi,
  nearbyKey,
}: {
  offerApi: OfferApi
  nearbyKey: NearbyOfferKey
}): Effect.Effect<
  OfferInfo,
  | InvalidNearbyKeyError
  | NearbyOfferNotFoundError
  | NotNearbyOfferError
  | DecryptingOfferError
  | NonCompatibleOfferVersionError
  | Effect.Effect.Error<
      ReturnType<OfferApi['getClubOffersForMeModifiedOrCreatedAfterPaginated']>
    >
> {
  return Effect.gen(function* (_) {
    const keyPair = yield* _(nearbyKeyToKeyPairE(nearbyKey))
    const {items} = yield* _(
      offerApi.getClubOffersForMeModifiedOrCreatedAfterPaginated({
        keyPair,
        limit: 1,
      })
    )
    const serverOffer = yield* _(
      Array.head(items),
      Effect.mapError(() => new NearbyOfferNotFoundError())
    )

    return yield* _(
      decryptOffer(keyPair)(serverOffer),
      Effect.filterOrFail(
        isNearbyOffer,
        (offerInfo) => new NotNearbyOfferError({offerInfo})
      )
    )
  })
}
