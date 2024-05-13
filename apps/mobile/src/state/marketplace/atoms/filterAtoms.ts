import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {type DropdownItemProps} from '../../../components/Dropdown'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {currencies} from '../../../utils/localization/currency'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {OffersFilter, type BaseOffersFilter} from '../domain'

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
  offerType: 'SELL',
  listingType: 'BITCOIN',
  singlePrice: undefined,
  text: undefined,
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

export const listingTypeFilterAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('listingType')
)

export const offerTypeFilterAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('offerType')
)

export const locationFilterAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('location')
)

export const singlePriceCurrencyAtom = focusAtom(offersFilterStorageAtom, (o) =>
  o.prop('filter').prop('singlePriceCurrency')
)

export const offersFilterTextFromStorageAtom = focusAtom(
  offersFilterFromStorageAtom,
  (o) => o.prop('text')
)

export const resetLocationFilterActionAtom = atom(null, (get, set) => {
  set(offersFilterFromStorageAtom, (old) => ({
    ...old,
    location: offersFilterInitialState.location,
    locationState: offersFilterInitialState.locationState,
    paymentMethod: offersFilterInitialState.paymentMethod,
  }))
})

export const isFilterActiveAtom = atom((get) => {
  // singlePriceCurrency and singlePrice are used only to calculate Product and Other offers filter SATS value for Price component
  // this value is stored, but it's not one of the filtering conditions
  // those values are used to calculate SATS value when filtering Product/Other offers
  const {
    singlePriceCurrency,
    singlePrice,
    text,
    // listingType and offerType are ignored as they are part of the main filter on marketplace
    listingType,
    offerType,
    ...offersFilterFromStorage
  } = get(offersFilterFromStorageAtom)
  const {
    singlePriceCurrency: spc,
    singlePrice: sp,
    text: t,
    listingType: lt,
    offerType: ot,
    ...filterInitialState
  } = offersFilterInitialState

  return (
    JSON.stringify({
      ...offersFilterFromStorage,
      singlePrice: listingType !== 'BITCOIN' ? singlePrice : undefined,
    } satisfies OffersFilter) !== JSON.stringify(filterInitialState)
  )
})

export const isTextFilterActiveAtom = atom(
  (get) => !!get(offersFilterFromStorageAtom).text
)

export const resetFilterInStorageActionAtom = atom(null, (get, set) => {
  const {offerType, listingType, ...restOfOffersFilterInitialState} =
    offersFilterInitialState
  set(offersFilterFromStorageAtom, (prev) => ({
    ...prev,
    ...restOfOffersFilterInitialState,
  }))
})

export const baseFilterDropdownDataAtom: Atom<
  Array<DropdownItemProps<BaseOffersFilter>>
> = atom((get) => {
  const {t} = get(translationAtom)
  const baseFilterOptions: BaseOffersFilter[] = [
    'BTC_TO_CASH',
    'CASH_TO_BTC',
    'BTC_TO_PRODUCT',
    'PRODUCT_TO_BTC',
    'STH_ELSE',
  ]

  return baseFilterOptions.map((option) => ({
    label: t(`filterOffers.${option}`),
    value: option,
  }))
})

export const baseFilterAtom = atom(
  (get): BaseOffersFilter | undefined => {
    const listingTypeFilter = get(listingTypeFilterAtom)
    const offerTypeFilter = get(offerTypeFilterAtom)
    if (listingTypeFilter === 'BITCOIN') {
      if (offerTypeFilter === 'BUY') return 'BTC_TO_CASH'
      return 'CASH_TO_BTC'
    }

    if (listingTypeFilter === 'PRODUCT') {
      if (offerTypeFilter === 'SELL') return 'PRODUCT_TO_BTC'
      return 'BTC_TO_PRODUCT'
    }

    if (listingTypeFilter === 'OTHER') {
      return 'STH_ELSE'
    }

    return undefined
  },
  (get, set, baseFilterValue: BaseOffersFilter | undefined) => {
    if (baseFilterValue === 'BTC_TO_CASH') {
      set(offerTypeFilterAtom, 'BUY')
      set(listingTypeFilterAtom, 'BITCOIN')
    }

    if (baseFilterValue === 'CASH_TO_BTC') {
      set(offerTypeFilterAtom, 'SELL')
      set(listingTypeFilterAtom, 'BITCOIN')
    }

    if (baseFilterValue === 'BTC_TO_PRODUCT') {
      set(offerTypeFilterAtom, 'BUY')
      set(listingTypeFilterAtom, 'PRODUCT')
    }

    if (baseFilterValue === 'PRODUCT_TO_BTC') {
      set(offerTypeFilterAtom, 'SELL')
      set(listingTypeFilterAtom, 'PRODUCT')
    }

    if (baseFilterValue === 'STH_ELSE') {
      set(offerTypeFilterAtom, undefined)
      set(listingTypeFilterAtom, 'OTHER')
    }
  }
)

export const submitSearchActionAtom = atom(
  null,
  (get, set, text: string | undefined = undefined) => {
    if (!text) {
      set(offersFilterTextFromStorageAtom, offersFilterInitialState.text)
      return
    }
    set(offersFilterTextFromStorageAtom, text)
  }
)
