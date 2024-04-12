import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {currencies} from '../../../utils/localization/currency'
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
  singlePrice: undefined,
  singlePriceCurrency: getDefaultCurrency().code ?? currencies.USD.code,
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

export const resetLocationFilterActionAtom = atom(null, (get, set) => {
  set(offersFilterFromStorageAtom, (old) => ({
    ...old,
    location: undefined,
    locationState: [],
    paymentMethod: undefined,
  }))
})

export const isFilterActiveAtom = atom((get) => {
  // singlePriceCurrency and singlePrice are used only to calculate Product and Other offers filter SATS value for Price component
  // this value is stored, but it's not one of the filtering conditions
  // those values are used to calculate SATS value when filtering Product/Other offers
  const {
    singlePriceCurrency: ignoredCurrency1,
    singlePrice: ignoredSinglePrice1,
    ...offersFilterFromStorage
  } = get(offersFilterFromStorageAtom)
  const {
    singlePriceCurrency: ignoredCurrency2,
    singlePrice: ignoredSinglePrice2,
    ...filterInitialState
  } = offersFilterInitialState

  return (
    JSON.stringify(offersFilterFromStorage) !==
    JSON.stringify(filterInitialState)
  )
})

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
