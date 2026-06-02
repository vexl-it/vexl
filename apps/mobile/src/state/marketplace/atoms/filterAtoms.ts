import {type FilterBarItem} from '@vexl-next/ui'
import {Array, Either, Record, Schema, pipe} from 'effect'
import {type ReadonlyArray} from 'effect/Array'
import {atom, type Atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getDefaultCurrency from '../../../utils/getDefaultCurrency'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {storage} from '../../../utils/mmkv/effectMmkv'
import reportError from '../../../utils/reportError'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderV2Atom'
import {
  MarketplaceFilterBarOption,
  OffersFilter,
  OffersFilterEquals,
} from '../domain'
import {isAmountFilterEnabled} from '../utils/filterMarketplaceOffers'

export const offersFilterInitialState = {
  sort: undefined,
  friendLevel: undefined,
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
  productCategories: undefined,
} satisfies OffersFilter

const OFFERS_FILTER_STORAGE_KEY = 'offersFilterV2'
const LEGACY_OFFERS_FILTER_STORAGE_KEY = 'offersFilter'
const OffersFilterStorage = Schema.Struct({filter: OffersFilter})
interface OffersFilterStorage {
  readonly filter: OffersFilter
}

const offersFilterDefaultStorageValue: OffersFilterStorage = {
  filter: offersFilterInitialState,
}

function readOffersFilterInitialStorageValue(): OffersFilterStorage {
  return pipe(
    storage.getVerified(OFFERS_FILTER_STORAGE_KEY, OffersFilterStorage),
    Either.match({
      onLeft: (currentStorageError) => {
        if (currentStorageError._tag !== 'ValueNotSet') {
          reportError(
            'warn',
            new Error(
              `Error while parsing stored value. Using provided default. Key: ${OFFERS_FILTER_STORAGE_KEY}`
            ),
            {currentStorageError}
          )
          return offersFilterDefaultStorageValue
        }

        return pipe(
          storage.getVerified(
            LEGACY_OFFERS_FILTER_STORAGE_KEY,
            OffersFilterStorage
          ),
          Either.match({
            onLeft: (legacyStorageError) => {
              if (legacyStorageError._tag !== 'ValueNotSet') {
                reportError(
                  'warn',
                  new Error(
                    `Error while migrating stored value. Using provided default. Key: ${LEGACY_OFFERS_FILTER_STORAGE_KEY}`
                  ),
                  {legacyStorageError}
                )
              }

              return offersFilterDefaultStorageValue
            },
            onRight: (legacyStorageValue) => {
              pipe(
                storage.saveVerified(
                  OFFERS_FILTER_STORAGE_KEY,
                  OffersFilterStorage
                )(legacyStorageValue),
                Either.mapLeft((saveStorageError) => {
                  reportError(
                    'warn',
                    new Error(
                      `Error while saving migrated value. Key: ${OFFERS_FILTER_STORAGE_KEY}`
                    ),
                    {saveStorageError}
                  )
                })
              )

              return legacyStorageValue
            },
          })
        )
      },
      onRight: (currentStorageValue) => currentStorageValue,
    })
  )
}

export const offersFilterStorageAtom = atomWithParsedMmkvStorage(
  OFFERS_FILTER_STORAGE_KEY,
  readOffersFilterInitialStorageValue(),
  OffersFilterStorage
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
    currency,
    amountBottomLimit,
    amountTopLimit,
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
      currency: isAmountFilterEnabled({amountBottomLimit, amountTopLimit})
        ? currency
        : undefined,
      amountBottomLimit,
      amountTopLimit,
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
