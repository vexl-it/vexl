import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {offersAtom} from './offersState'
import sortOffers from '../utils/sortOffers'
import {splitAtom} from 'jotai/utils'
import {
  type MyOfferInState,
  type Sort,
} from '@vexl-next/domain/dist/general/offers'

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

export const selectedMyOffersSortingOptionAtom = atom<Sort>('NEWEST_OFFER')
