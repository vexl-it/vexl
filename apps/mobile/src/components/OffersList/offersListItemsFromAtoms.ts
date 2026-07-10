import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {type Atom} from 'jotai'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import {type OffersListItemData, type OffersListOfferItem} from './domain'

export function offersListItemsFromAtoms(
  offersAtoms: ReadonlyArray<Atom<OneOfferInState>>
): OffersListItemData[] {
  return pipe(
    offersAtoms,
    Array.map(
      (offerAtom): OffersListOfferItem => ({
        type: 'offer',
        key: atomKeyExtractor(offerAtom),
        offerAtom,
        swipeEnabled: false,
      })
    )
  )
}
