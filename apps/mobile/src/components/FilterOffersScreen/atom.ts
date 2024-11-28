import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcNetwork,
  type IntendedConnectionLevel,
  type ListingType,
  type LocationState,
  type OfferLocation,
  type OfferType,
  type PaymentMethod,
  type Sort,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {calculateViewportRadius} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../state/currentBtcPriceAtoms'
import {
  offerTypeFilterAtom,
  offersFilterFromStorageAtom,
  offersFilterInitialState,
} from '../../state/marketplace/atoms/filterAtoms'
import {clearRegionAndRefocusActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {animateToCoordinateActionAtom} from '../../state/marketplace/atoms/map/mapViewAtoms'
import marketplaceLayoutModeAtom from '../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {
  type BaseOffersFilter,
  type OffersFilter,
} from '../../state/marketplace/domain'
import getOfferLocationBorderPoints from '../../state/marketplace/utils/getOfferLocationBorderPoints'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import calculatePriceInFiatFromSats from '../../utils/calculatePriceInFiatFromSats'
import calculatePriceInSats from '../../utils/calculatePriceInSats'
import {currencies} from '../../utils/localization/currency'

export const currencySelectVisibleAtom = atom<boolean>(false)

export const listingTypeAtom = atom<ListingType | undefined>(
  offersFilterInitialState.listingType
)

export const offerTypeAtom = atom<OfferType | undefined>(
  offersFilterInitialState.offerType
)

export const currencyAtom = atom<CurrencyCode | undefined>(
  offersFilterInitialState.currency
)

const spokenLanguagesAtom = atom<SpokenLanguage[]>(
  offersFilterInitialState.spokenLanguages
)
export const spokenLanguagesAtomsAtom = splitAtom(spokenLanguagesAtom)

export const sortingAtom = atom<Sort | undefined>(undefined)

export const intendedConnectionLevelAtom = atom<IntendedConnectionLevel>('ALL')

export const locationStateAtom = atom<readonly LocationState[] | undefined>(
  offersFilterInitialState.locationState
)

export const locationAtom = atom<OfferLocation | undefined>(
  offersFilterInitialState.location
)

export const locationArrayOfOneAtom = atom(
  (get): readonly OfferLocation[] | undefined => {
    const location = get(locationAtom)
    if (location) {
      return [location]
    }
    return undefined
  },
  (get, set, action: SetStateAction<readonly OfferLocation[] | undefined>) => {
    const location = getValueFromSetStateActionOfAtom(action)(() =>
      get(locationArrayOfOneAtom)
    )
    if (!location || location.length === 0) set(locationAtom, undefined)
    else set(locationAtom, location.at(-1))
  }
)

export const btcNetworkAtom = atom<readonly BtcNetwork[] | undefined>(
  offersFilterInitialState.btcNetwork
)

export const paymentMethodAtom = atom<readonly PaymentMethod[] | undefined>(
  offersFilterInitialState.paymentMethod
)

export const amountBottomLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountBottomLimit
)

export const amountTopLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountTopLimit
)

export const singlePriceActiveAtom = atom<boolean>(true)

export const singlePriceAtom = atom<number | undefined>(
  offersFilterInitialState.singlePrice
)

export const singlePriceCurrencyAtom = atom<CurrencyCode | undefined>(
  offersFilterInitialState.singlePriceCurrency
)

export const btcPriceForOfferWithCurrencyAtom = createBtcPriceForCurrencyAtom(
  singlePriceCurrencyAtom
)

export const locationActiveAtom = atom<boolean | undefined>(true)

export const updateBtcNetworkAtom = atom(
  (get) => get(btcNetworkAtom),
  (get, set, btcNetwork: BtcNetwork) => {
    set(btcNetworkAtom, (prev) =>
      prev?.includes(btcNetwork) ? undefined : [btcNetwork]
    )
  }
)

export const updateCurrencyLimitsAtom = atom<
  null,
  [
    {
      currency: CurrencyCode | undefined
    },
  ],
  boolean
>(null, (get, set, params) => {
  const {currency} = params

  if (currency) {
    void set(refreshBtcPriceActionAtom, currency)()
  }

  set(currencyAtom, currency)
  set(amountBottomLimitAtom, 0)
  set(amountTopLimitAtom, currency ? currencies[currency].maxAmount : 0)

  return true
})

export const changePriceCurrencyActionAtom = atom(
  null,
  (get, set, currencyCode: CurrencyCode) => {
    set(singlePriceCurrencyAtom, currencyCode)
    void set(refreshBtcPriceActionAtom, currencyCode)()
  }
)

export const updateLocationStateAndPaymentMethodAtom = atom(
  null,
  (get, set, locationState: LocationState) => {
    const locationStateFromAtom = get(locationStateAtom)

    set(locationStateAtom, (prev) =>
      prev?.includes(locationState) ? [] : [locationState]
    )

    if (locationState === 'ONLINE') set(locationAtom, undefined)

    if (locationStateFromAtom?.includes(locationState)) {
      set(paymentMethodAtom, undefined)
      set(locationAtom, undefined)
    } else {
      set(
        paymentMethodAtom,
        locationState === 'ONLINE' ? ['BANK', 'REVOLUT'] : ['CASH']
      )
    }
  }
)

export const satsValueAtom = atom<number>(0)

export const calculateSatsValueOnFiatValueChangeActionAtom = atom(
  null,
  (get, set, priceString: string) => {
    if (!priceString || isNaN(Number(priceString))) {
      set(satsValueAtom, 0)
      set(singlePriceAtom, undefined)
      return
    }
    const priceNumber = Number(priceString)
    const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

    set(singlePriceAtom, priceNumber)

    if (currentBtcPrice) {
      set(
        satsValueAtom,
        calculatePriceInSats({
          price: priceNumber,
          currentBtcPrice: currentBtcPrice.BTC,
        }) ?? 0
      )
    }
  }
)

export const calculateFiatValueOnSatsValueChangeActionAtom = atom(
  null,
  (get, set, satsString: string) => {
    if (!satsString || isNaN(Number(satsString))) {
      set(singlePriceAtom, undefined)
      set(satsValueAtom, 0)
      return
    }

    const satsNumber = Number(satsString)
    const currentBtcPrice = get(btcPriceForOfferWithCurrencyAtom)?.btcPrice

    set(satsValueAtom, satsNumber)

    if (currentBtcPrice) {
      set(
        singlePriceAtom,
        calculatePriceInFiatFromSats({
          satsNumber,
          currentBtcPrice: currentBtcPrice.BTC,
        })
      )
    }
  }
)

export const selectedSpokenLanguagesAtom = atom<SpokenLanguage[]>([])

export const removeSpokenLanguageActionAtom = atom(
  null,
  (get, set, spokenLanguage: SpokenLanguage) => {
    const spokenLanguages = get(spokenLanguagesAtom)
    const selectedSpokenLanguages = get(selectedSpokenLanguagesAtom)

    set(
      spokenLanguagesAtom,
      spokenLanguages.filter((language) => language !== spokenLanguage)
    )
    set(
      selectedSpokenLanguagesAtom,
      selectedSpokenLanguages.filter((language) => language !== spokenLanguage)
    )
  }
)

export function createIsThisLanguageSelectedAtom(
  spokenLanguage: SpokenLanguage
): WritableAtom<boolean, [SetStateAction<boolean>], void> {
  return atom(
    (get) => get(selectedSpokenLanguagesAtom).includes(spokenLanguage),
    (get, set, isSelected: SetStateAction<boolean>) => {
      const selectedSpokenLanguages = get(selectedSpokenLanguagesAtom)
      const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
        get(selectedSpokenLanguagesAtom).includes(spokenLanguage)
      )

      if (selected) {
        set(selectedSpokenLanguagesAtom, [
          ...selectedSpokenLanguages,
          spokenLanguage,
        ])
      } else {
        set(
          selectedSpokenLanguagesAtom,
          selectedSpokenLanguages.filter((lang) => lang !== spokenLanguage)
        )
      }
    }
  )
}

export const resetSpokenLanguagesToInitialStateActionAtom = atom(
  null,
  (get, set) => {
    set(selectedSpokenLanguagesAtom, get(spokenLanguagesAtom))
  }
)

export const saveSelectedSpokenLanguagesActionAtom = atom(null, (get, set) => {
  set(spokenLanguagesAtom, get(selectedSpokenLanguagesAtom))
})

export const setOfferLocationActionAtom = atom(
  null,
  (get, set, locationSuggestion: LocationSuggestion) => {
    set(locationAtom, {
      placeId: locationSuggestion.userData.placeId,
      address:
        locationSuggestion.userData.suggestFirstRow +
        ', ' +
        locationSuggestion.userData.suggestSecondRow,
      shortAddress: locationSuggestion.userData.suggestFirstRow,
      latitude: locationSuggestion.userData.latitude,
      longitude: locationSuggestion.userData.longitude,
      radius: calculateViewportRadius(locationSuggestion.userData.viewport),
    })
  }
)

const setConditionallyRenderedFilterElementsActionAtom = atom(
  null,
  (get, set, filterValue: OffersFilter) => {
    set(currencyAtom, filterValue.currency)
    set(locationAtom, filterValue.location)
    set(locationStateAtom, filterValue.locationState)
    set(paymentMethodAtom, filterValue.paymentMethod)
    set(btcNetworkAtom, filterValue.btcNetwork)
    set(amountBottomLimitAtom, filterValue.amountBottomLimit)
    set(amountTopLimitAtom, filterValue.amountTopLimit)
    set(spokenLanguagesAtom, filterValue.spokenLanguages)
    set(singlePriceAtom, filterValue.singlePrice)
    set(singlePriceCurrencyAtom, filterValue.singlePriceCurrency)
    set(
      intendedConnectionLevelAtom,
      filterValue.friendLevel?.includes('SECOND_DEGREE') ? 'ALL' : 'FIRST'
    )
    set(satsValueAtom, 0)
  }
)

const setFilterAtomsActionAtom = atom(
  null,
  (get, set, filterValue: OffersFilter) => {
    set(listingTypeAtom, filterValue.listingType)
    set(offerTypeAtom, filterValue.offerType)
    set(sortingAtom, filterValue.sort)
    set(setConditionallyRenderedFilterElementsActionAtom, filterValue)
  }
)

export const initializeOffersFilterOnDisplayActionAtom = atom(
  null,
  (get, set) => {
    const filterFromStorage = get(offersFilterFromStorageAtom)

    set(setFilterAtomsActionAtom, filterFromStorage)
    set(
      calculateSatsValueOnFiatValueChangeActionAtom,
      String(filterFromStorage.singlePrice)
    )
  }
)

export const resetFilterOmitTextFilterActionAtom = atom(null, (get, set) => {
  const {offerType, listingType, text, ...restOfOffersFilterInitialState} =
    offersFilterInitialState

  set(setFilterAtomsActionAtom, {
    listingType: get(listingTypeAtom),
    offerType: get(offerTypeAtom),
    ...restOfOffersFilterInitialState,
  })
})

export const baseFilterTempAtom = atom(
  (get): BaseOffersFilter => {
    const listingType = get(listingTypeAtom)
    const offerType = get(offerTypeAtom) ?? get(offerTypeFilterAtom)

    if (listingType === 'BITCOIN') {
      if (offerType === 'SELL') return 'BTC_TO_CASH'
      return 'CASH_TO_BTC'
    }

    if (listingType === 'PRODUCT') {
      if (offerType === 'SELL') return 'PRODUCT_TO_BTC'
      return 'BTC_TO_PRODUCT'
    }

    if (listingType === 'OTHER') return 'STH_ELSE'

    if (!listingType) {
      if (offerType === 'SELL') return 'ALL_SELLING_BTC'
      return 'ALL_BUYING_BTC'
    }

    return 'BTC_TO_CASH'
  },
  (_, set, filterValue: BaseOffersFilter) => {
    if (filterValue === 'BTC_TO_CASH') {
      set(listingTypeAtom, 'BITCOIN')
      set(offerTypeAtom, 'SELL')
    }

    if (filterValue === 'CASH_TO_BTC') {
      set(listingTypeAtom, 'BITCOIN')
      set(offerTypeAtom, 'BUY')
    }

    if (filterValue === 'BTC_TO_PRODUCT') {
      set(listingTypeAtom, 'PRODUCT')
      set(offerTypeAtom, 'BUY')
    }

    if (filterValue === 'PRODUCT_TO_BTC') {
      set(listingTypeAtom, 'PRODUCT')
      set(offerTypeAtom, 'SELL')
    }

    if (filterValue === 'STH_ELSE') {
      set(listingTypeAtom, 'OTHER')
      set(offerTypeAtom, undefined)
    }

    if (filterValue === 'ALL_SELLING_BTC') {
      set(listingTypeAtom, undefined)
      set(offerTypeAtom, 'SELL')
    }

    if (filterValue === 'ALL_BUYING_BTC') {
      set(listingTypeAtom, undefined)
      set(offerTypeAtom, 'BUY')
    }
  }
)

export const saveFilterActionAtom = atom(null, (get, set) => {
  const marketplaceLayoutMode = get(marketplaceLayoutModeAtom)
  const {text} = get(offersFilterFromStorageAtom)

  const newFilterValue: OffersFilter = {
    sort: get(sortingAtom),
    listingType: get(listingTypeAtom),
    offerType: get(offerTypeAtom),
    currency: get(currencyAtom),
    location: get(locationAtom),
    locationState: get(locationStateAtom),
    paymentMethod: get(paymentMethodAtom),
    btcNetwork: get(btcNetworkAtom),
    friendLevel:
      get(intendedConnectionLevelAtom) === 'FIRST'
        ? ['FIRST_DEGREE']
        : ['FIRST_DEGREE', 'SECOND_DEGREE'],
    spokenLanguages: get(spokenLanguagesAtom),
    amountBottomLimit: get(amountBottomLimitAtom),
    amountTopLimit: get(amountTopLimitAtom),
    singlePrice: get(singlePriceAtom),
    singlePriceCurrency: get(singlePriceCurrencyAtom),
  }

  set(offersFilterFromStorageAtom, {...newFilterValue, text})

  if (marketplaceLayoutMode === 'map') {
    const location = get(locationAtom)
    if (location)
      set(animateToCoordinateActionAtom, getOfferLocationBorderPoints(location))
    else set(clearRegionAndRefocusActionAtom)
  }
})
