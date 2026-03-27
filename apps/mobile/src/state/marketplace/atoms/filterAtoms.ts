import {type FilterBarItem} from '@vexl-next/ui'
import {Array, Record, Schema} from 'effect'
import {type ReadonlyArray} from 'effect/Array'
import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderV2Atom'
import {
  MarketplaceFilterBarOption,
  OffersFilter,
  OffersFilterEquals,
} from '../domain'

export const offersFilterInitialState = {
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
  filterBarOptions: new Set<MarketplaceFilterBarOption>(),
  singlePrice: undefined,
  text: undefined,
  singlePriceCurrency: getDefaultCurrency(),
  clubsUuids: undefined,
} satisfies OffersFilter

export const offersFilterStorageAtom = atomWithParsedMmkvStorage(
  'offersFilter',
  {filter: offersFilterInitialState},
  Schema.Struct({filter: OffersFilter})
)

export const offersFilterFromStorageAtom = focusAtom(
  offersFilterStorageAtom,
  (o) => o.prop('filter')
)

export const filterBarOptionsAtom = focusAtom(
  offersFilterFromStorageAtom,
  (o) => o.prop('filterBarOptions')
)

export const locationFilterAtom = focusAtom(offersFilterFromStorageAtom, (o) =>
  o.prop('location')
)

export const singlePriceCurrencyAtom = focusAtom(
  offersFilterFromStorageAtom,
  (o) => o.prop('singlePriceCurrency')
)

export const searchTextAtom = focusAtom(offersFilterFromStorageAtom, (o) =>
  o.prop('text')
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
    // filterBarOptions is ignored since it is part of the main filter on marketplace
    filterBarOptions,
    location,
    ...offersFilterFromStorage
  } = get(offersFilterFromStorageAtom)

  const {
    singlePriceCurrency: spc,
    text: t,
    filterBarOptions: fbo,
    ...filterInitialState
  } = offersFilterInitialState

  return !OffersFilterEquals(
    {
      ...offersFilterFromStorage,
      filterBarOptions: fbo,
      singlePrice: Array.isNonEmptyArray(
        Array.intersection(Array.fromIterable(filterBarOptions), [
          'BUY_PRODUCT',
          'SELL_PRODUCT',
          'HIRE_SERVICE',
          'PROVIDE_SERVICE',
        ])
      )
        ? singlePrice
        : undefined,
      location: location?.length === 0 ? undefined : location,
      clubsUuids:
        offersFilterFromStorage.clubsUuids?.length ===
        Record.values(get(clubsToKeyHolderAtom)).length
          ? undefined
          : offersFilterFromStorage.clubsUuids,
    } satisfies OffersFilter,
    {...filterInitialState, filterBarOptions: fbo}
  )
})

export const isTextFilterActiveAtom = atom(
  (get) => !!get(offersFilterFromStorageAtom).text
)

export const resetFilterInStorageActionAtom = atom(null, (get, set) => {
  const {filterBarOptions, ...restOfOffersFilterInitialState} =
    offersFilterInitialState

  set(offersFilterFromStorageAtom, (prev) => ({
    ...prev,
    ...restOfOffersFilterInitialState,
  }))
})

export const marketplaceFilterBarFieldsAtom: Atom<
  ReadonlyArray<FilterBarItem<MarketplaceFilterBarOption>>
> = atom((get) => {
  const {t} = get(translationAtom)
  const baseFilterOptions = MarketplaceFilterBarOption.literals

  return baseFilterOptions.map((option) => ({
    label: t(`marketplaceFilter.${option}`),
    value: option,
  }))
})

export const marketplaceFilterBarSelectedFieldAtom = focusAtom(
  offersFilterFromStorageAtom,
  (o) => o.prop('filterBarOptions')
)

export const submitSearchActionAtom = atom(
  null,
  (get, set, text: string | undefined = undefined) => {
    if (!text) {
      set(searchTextAtom, offersFilterInitialState.text)
      return
    }
    set(searchTextAtom, text)
  }
)
