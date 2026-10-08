import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array} from 'effect'

export const hasNearbySource = ({
  privatePart: {friendLevel},
}: OfferInfo): boolean => Array.contains(friendLevel, 'NEARBY')

export const isOnlyNearbyOffer = ({
  privatePart: {friendLevel},
}: OfferInfo): boolean =>
  Array.isNonEmptyReadonlyArray(friendLevel) &&
  Array.every(friendLevel, (one) => one === 'NEARBY')

// Nearby-only offers already say "Nearby" in place of the friend level
export const showsNearbyTag = (offerInfo: OfferInfo): boolean =>
  hasNearbySource(offerInfo) && !isOnlyNearbyOffer(offerInfo)
