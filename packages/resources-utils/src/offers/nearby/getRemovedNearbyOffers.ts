import {
  type NearbyOfferKey,
  type OfferId,
} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, pipe, Record} from 'effect'
import {nearbyKeyToKeyPairE, type InvalidNearbyKeyError} from './nearbyKey'

export function getRemovedNearbyOffers({
  offerApi,
  keysByOfferId,
}: {
  offerApi: OfferApi
  keysByOfferId: Record<OfferId, NearbyOfferKey>
}): Effect.Effect<
  readonly OfferId[],
  | InvalidNearbyKeyError
  | Effect.Effect.Error<ReturnType<OfferApi['getRemovedClubOffers']>>
> {
  return pipe(
    Record.toEntries(keysByOfferId),
    Effect.forEach(
      ([offerId, nearbyKey]) =>
        nearbyKeyToKeyPairE(nearbyKey).pipe(
          Effect.flatMap((keyPair) =>
            offerApi.getRemovedClubOffers({offerIds: [offerId], keyPair})
          ),
          Effect.map(({offerIds}) => offerIds)
        ),
      {concurrency: 5}
    ),
    Effect.map(Array.flatten)
  )
}
