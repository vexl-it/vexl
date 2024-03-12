import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {OffersFilter} from '../domain'

export const offersFilterInitialState: OffersFilter = {
  sort: undefined,
  friendLevel: ['FIRST_DEGREE', 'SECOND_DEGREE'],
  currency: undefined,
  location: undefined,
  locationState: undefined,
  paymentMethod: undefined,
  btcNetwork: undefined,
  spokenLanguages: [],
  amountBottomLimit: undefined,
  amountTopLimit: undefined,
  text: undefined,
  listingType: undefined,
}

export const offersFilterStorageAtom = atomWithParsedMmkvStorage(
  'offersFilter',
  {filter: offersFilterInitialState},
  z.object({filter: OffersFilter})
)

export const offersFilterFromStorageAtom = focusAtom(
  offersFilterStorageAtom,
  (o) => o.prop('filter')
)

export const locationFilterAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('location')
)

export const listingTypeFilterAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('listingType')
)

export const resetLocationFilterActionAtom = atom(null, (get, set) => {
  set(offersFilterFromStorageAtom, (old) => ({
    ...old,
    location: undefined,
    locationState: undefined,
    paymentMethod: undefined,
  }))
})

export const isFilterActiveAtom = selectAtom(
  offersFilterFromStorageAtom,
  (offersFilterFromStorage) => {
    return (
      JSON.stringify(offersFilterFromStorage) !==
      JSON.stringify(offersFilterInitialState)
    )
  }
)

export const isTextFilterActiveAtom = selectAtom(
  offersFilterFromStorageAtom,
  ({text}) => !!text
)

export const offersFilterTextFromStorageAtom = focusAtom(
  offersFilterFromStorageAtom,
  (o) => o.prop('text')
)

export const resetFilterInStorageActionAtom = atom(null, (get, set) => {
  set(offersFilterFromStorageAtom, offersFilterInitialState)
})
