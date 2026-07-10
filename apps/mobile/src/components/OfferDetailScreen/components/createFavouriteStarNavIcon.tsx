import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {FavouriteStarNavIcon, type IconProps} from '@vexl-next/ui'
import {atom, useAtomValue} from 'jotai'
import React from 'react'
import {singleOfferAtom} from '../../../state/marketplace/atoms/offersState'

/**
 * Creates a nav bar icon component for the given offer which follows the
 * favourite state of the offer and mirrors the exported star animation timing.
 *
 * It is a factory so the resulting component fits the
 * `NavigationBarAction.icon` contract. Memoize the result on offerId.
 */
export function createFavouriteStarNavIcon(
  offerId: OfferId
): React.ComponentType<IconProps> {
  const offerAtom = singleOfferAtom(offerId)
  const isFavouriteAtom = atom(
    (get) => get(offerAtom)?.flags.mark?.type === 'FAVOURITE'
  )

  return function BoundFavouriteStarNavIcon({
    ...props
  }: IconProps): React.JSX.Element {
    const isFavourite = useAtomValue(isFavouriteAtom)

    return <FavouriteStarNavIcon {...props} isFavourite={isFavourite} />
  }
}
