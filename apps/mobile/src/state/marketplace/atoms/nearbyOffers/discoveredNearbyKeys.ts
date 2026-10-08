import {
  NearbyOfferKey,
  type OfferId,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe, Record, Schema} from 'effect'
import {type AppStateStatus} from 'react-native'

// A key is new until it is stored, even when its offer is already known from
// contacts or clubs: the user is told someone nearby shares it, not that the
// offer itself is new.
export const newlyDiscoveredNearbyKeys = ({
  discoveredKeys,
  receivedKeysByOfferId,
  myKeys,
}: {
  discoveredKeys: readonly string[]
  receivedKeysByOfferId: Record<OfferId, {readonly key: NearbyOfferKey}>
  myKeys: readonly NearbyOfferKey[]
}): readonly NearbyOfferKey[] =>
  pipe(
    discoveredKeys,
    Array.filterMap((key) => Schema.decodeUnknownOption(NearbyOfferKey)(key)),
    Array.dedupe,
    Array.difference(
      pipe(
        Record.values(receivedKeysByOfferId),
        Array.map(({key}) => key),
        Array.appendAll(myKeys)
      )
    )
  )

export const nearbyOfferIdsToNotifyAbout = ({
  discoveredOfferIds,
  appState,
}: {
  discoveredOfferIds: readonly OfferId[]
  appState: AppStateStatus
}): Option.Option<Array.NonEmptyReadonlyArray<OfferId>> => {
  const offerIds = Array.dedupe(discoveredOfferIds)
  return appState !== 'active' && Array.isNonEmptyReadonlyArray(offerIds)
    ? Option.some(offerIds)
    : Option.none()
}
