import {
  type MyOfferInState,
  type Sort,
} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import sortOffers from '../utils/sortOffers'
import {offersAtom} from './offersState'

export const myOffersAtom = focusAtom(offersAtom, (optic) =>
  optic.filter(
    (offer): offer is MyOfferInState => !!offer.ownershipInfo?.adminId
  )
)

export const myOffersSortedAtom = atom((get) => {
  const sortingOptions = get(selectedMyOffersSortingOptionAtom)
  const myOffers = get(myOffersAtom)

  return sortOffers(myOffers, sortingOptions)
})

export const myOffersSortedAtomsAtom = splitAtom(myOffersSortedAtom)

export const myActiveOffersAtom = focusAtom(myOffersAtom, (optic) =>
  optic.filter((myOffer) => myOffer.offerInfo.publicPart.active)
)

export const displayAddListingTypeAtom = atom<boolean>(true)

export const shouldDisplaySuggestionToAddListingTypeAtom = atom(
  (get) => {
    const myOffers = get(myOffersAtom)
    const displayAddListingType = get(displayAddListingTypeAtom)
    const anyOfferWithoutListingType = myOffers.some(
      (offer) => !offer.offerInfo.publicPart.listingType
    )

    return displayAddListingType && anyOfferWithoutListingType
  },
  (get, set, visible: boolean) => {
    set(displayAddListingTypeAtom, visible)
  }
)

export const selectedMyOffersSortingOptionAtom = atom<Sort>('NEWEST_OFFER')
