import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcNetwork,
  type IntendedConnectionLevel,
  type LocationState,
  type OfferLocation,
  type PaymentMethod,
  type ProductCategory,
  type Sort,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {calculateViewportRadius} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {toggleValueInSet} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {
  atom,
  type Atom,
  type Getter,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {atomFamily, splitAtom} from 'jotai/utils'
import {clubsWithMembersAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
import {type ClubWithMembers} from '../../state/clubs/domain'
import {
  createBtcPriceForCurrencyAtom,
  createBtcPricesReadyAtom,
  createMaxAmountForCurrencyAtom,
  refreshBtcPriceActionAtom,
  refreshBtcPriceWithEurEffect,
} from '../../state/currentBtcPriceAtoms'
import {
  offersFilterFromStorageAtom,
  offersFilterInitialState,
} from '../../state/marketplace/atoms/filterAtoms'
import {clearRegionAndRefocusActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {animateToCoordinateActionAtom} from '../../state/marketplace/atoms/map/mapViewAtoms'
import marketplaceLayoutModeAtom from '../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {offersToSeeInMarketplaceAtom} from '../../state/marketplace/atoms/offersToSeeInMarketplace'
import {
  type MarketplaceFilterBarOption,
  type OffersFilter,
} from '../../state/marketplace/domain'
import {
  filterMarketplaceOffers,
  filterOffersByViewport,
  selectOffersByMarketplaceFilterBarOptions,
  shouldCombineOnlineOffersWithLocationFilter,
} from '../../state/marketplace/utils/filterMarketplaceOffers'
import getOfferLocationBorderPoints from '../../state/marketplace/utils/getOfferLocationBorderPoints'
import {radiusToViewport} from '../../state/marketplace/utils/toViewport'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import calculatePriceInFiatFromSats from '../../utils/calculatePriceInFiatFromSats'
import calculatePriceInSats from '../../utils/calculatePriceInSats'
import {defaultCurrencyAtom} from '../../utils/preferences'

export const currencySelectVisibleAtom = atom<boolean>(false)

export const filterBarOptionsAtom = atom<
  ReadonlySet<MarketplaceFilterBarOption>
>(offersFilterInitialState.filterBarOptions)

export const toggleFilterBarOptionActionAtom = atom(
  null,
  (get, set, value: MarketplaceFilterBarOption) => {
    set(filterBarOptionsAtom, (prev) => toggleValueInSet(prev, value))
  }
)

export const currencyAtom = atom<CurrencyCode | undefined>(
  offersFilterInitialState.currency
)

const spokenLanguagesAtom = atom<SpokenLanguage[]>(
  offersFilterInitialState.spokenLanguages
)
export const spokenLanguagesAtomsAtom = splitAtom(spokenLanguagesAtom)

export const sortingAtom = atom<Sort | undefined>(undefined)

export const intendedConnectionLevelAtom = atom<
  IntendedConnectionLevel | undefined
>(undefined)

export const locationStateAtom = atom<readonly LocationState[] | undefined>(
  offersFilterInitialState.locationState
)

export const isOnlineFilterAtom = atom(
  (get) => get(locationStateAtom)?.includes('ONLINE') ?? false
)

export const isOnlineFilterVisibleAtom = atom((get) => {
  const options = get(filterBarOptionsAtom)
  if (options.size === 0) return true
  return !pipe(
    Array.fromIterable(options),
    Array.every(
      (option) => option === 'PROVIDE_SERVICE' || option === 'HIRE_SERVICE'
    )
  )
})

export const locationAtom = atom<readonly OfferLocation[] | undefined>(
  offersFilterInitialState.location
)

const clubsFilterEnabledBaseAtom = atom<boolean>(false)

export const clubsFilterEnabledAtom = atom(
  (get) => get(clubsFilterEnabledBaseAtom),
  (get, set, action: SetStateAction<boolean>) => {
    const enabled = getValueFromSetStateActionOfAtom(action)(() =>
      get(clubsFilterEnabledBaseAtom)
    )
    set(clubsFilterEnabledBaseAtom, enabled)
    if (enabled) {
      const allClubUuids = get(clubsWithMembersAtom).map(
        (club) => club.club.uuid
      )
      set(clubsUuidsFilterAtom, allClubUuids)
    }
  }
)

export const clubsUuidsFilterAtom = atom<readonly ClubUuid[] | undefined>(
  offersFilterInitialState.clubsUuids
)

export const productCategoriesAtom = atom<
  readonly ProductCategory[] | undefined
>(offersFilterInitialState.productCategories)

export const isProductFilterActiveAtom = atom((get) => {
  const options = get(filterBarOptionsAtom)
  return options.has('BUY_PRODUCT') || options.has('SELL_PRODUCT')
})

export const isThisProductCategorySelectedAtomFamily = atomFamily(
  (
    category: ProductCategory
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> =>
    atom(
      (get) => get(productCategoriesAtom)?.includes(category) ?? false,
      (get, set, isSelected: SetStateAction<boolean>) => {
        const selected = getValueFromSetStateActionOfAtom(isSelected)(
          () => get(productCategoriesAtom)?.includes(category) ?? false
        )

        if (selected) {
          set(productCategoriesAtom, (prev) => [...(prev ?? []), category])
        } else {
          set(productCategoriesAtom, (prev) =>
            prev?.filter((c) => c !== category)
          )
        }
      }
    )
)

export const locationArrayOfOneAtom = atom(
  (get): readonly OfferLocation[] | undefined => get(locationAtom),
  (get, set, action: SetStateAction<readonly OfferLocation[] | undefined>) => {
    const location = getValueFromSetStateActionOfAtom(action)(() =>
      get(locationArrayOfOneAtom)
    )
    if (!location || location.length === 0) set(locationAtom, undefined)
    else set(locationAtom, [...location])
  }
)

export const removeOfferLocationActionAtom = atom(
  null,
  (get, set, locationToRemove: OfferLocation) => {
    const location = get(locationAtom)
    const filtered = location?.filter(
      (loc) => loc.placeId !== locationToRemove.placeId
    )
    set(locationAtom, filtered && filtered.length > 0 ? filtered : undefined)
  }
)

export const btcNetworkAtom = atom<readonly BtcNetwork[] | undefined>(
  offersFilterInitialState.btcNetwork
)

export const paymentMethodAtom = atom<readonly PaymentMethod[] | undefined>(
  offersFilterInitialState.paymentMethod
)

const amountFilterEnabledBaseAtom = atom<boolean>(false)

export const amountFilterEnabledAtom = atom(
  (get) => get(amountFilterEnabledBaseAtom),
  (get, set, action: SetStateAction<boolean>) => {
    const enabled = getValueFromSetStateActionOfAtom(action)(() =>
      get(amountFilterEnabledBaseAtom)
    )
    set(amountFilterEnabledBaseAtom, enabled)
    if (enabled) {
      if (!get(currencyAtom)) {
        const currency = get(defaultCurrencyAtom)
        set(updateCurrencyLimitsAtom, {currency})
      }
    } else {
      set(currencyAtom, undefined)
    }
  }
)

export const amountBottomLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountBottomLimit
)

export const amountTopLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountTopLimit
)

export const amountBottomLimitForRangeInputAtom = atom(
  (get): number => get(amountBottomLimitAtom) ?? 0,
  (get, set, update: SetStateAction<number>) => {
    const value = getValueFromSetStateActionOfAtom(update)(
      () => get(amountBottomLimitAtom) ?? 0
    )
    set(amountBottomLimitAtom, value)
  }
)

export const maxAmountForFilterCurrencyAtom =
  createMaxAmountForCurrencyAtom(currencyAtom)

export const btcPricesReadyForFilterAtom =
  createBtcPricesReadyAtom(currencyAtom)

export const amountTopLimitForRangeInputAtom = atom(
  (get): number => {
    const amountTopLimit = get(amountTopLimitAtom)
    if (amountTopLimit !== undefined) return amountTopLimit

    return get(currencyAtom) ? get(maxAmountForFilterCurrencyAtom) : 0
  },
  (get, set, update: SetStateAction<number>) => {
    const value = getValueFromSetStateActionOfAtom(update)(() => {
      const currentAmountTopLimit = get(amountTopLimitAtom)
      if (currentAmountTopLimit !== undefined) return currentAmountTopLimit

      return get(currencyAtom) ? get(maxAmountForFilterCurrencyAtom) : 0
    })
    set(amountTopLimitAtom, value)
  }
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

export const btcPriceForFilterCurrencyAtom =
  createBtcPriceForCurrencyAtom(currencyAtom)

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

  set(currencyAtom, currency)
  set(amountBottomLimitAtom, 0)
  set(amountTopLimitAtom, currency ? get(maxAmountForFilterCurrencyAtom) : 0)

  if (currency) {
    // Realign the top limit to the fresh cap once prices resolve — otherwise
    // after a currency switch the slider stays pinned at the prior cap number
    // (e.g. 10 000 EUR becoming 10 000 HUF when HUF's cap is ~4 000 000).
    void Effect.runPromise(
      Effect.gen(function* (_) {
        yield* _(refreshBtcPriceWithEurEffect(set, currency))
        if (get(currencyAtom) === currency) {
          set(amountTopLimitAtom, get(maxAmountForFilterCurrencyAtom))
        }
      })
    )
  }

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

    if (locationStateFromAtom?.includes(locationState)) {
      set(paymentMethodAtom, undefined)
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

export const removeSpokenLanguageActionAtom = atom(
  null,
  (get, set, spokenLanguage: SpokenLanguage) => {
    const spokenLanguages = get(spokenLanguagesAtom)

    set(
      spokenLanguagesAtom,
      spokenLanguages.filter((language) => language !== spokenLanguage)
    )
  }
)

export const isThisLanguageSelectedAtomFamily = atomFamily(
  (
    spokenLanguage: SpokenLanguage
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> =>
    atom(
      (get) => get(spokenLanguagesAtom).includes(spokenLanguage),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const spokenLanguages = get(spokenLanguagesAtom)
        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(spokenLanguagesAtom).includes(spokenLanguage)
        )

        if (selected) {
          set(spokenLanguagesAtom, [...spokenLanguages, spokenLanguage])
        } else {
          set(
            spokenLanguagesAtom,
            spokenLanguages.filter((lang) => lang !== spokenLanguage)
          )
        }
      }
    )
)

export const setOfferLocationActionAtom = atom(
  null,
  (get, set, locationSuggestion: LocationSuggestion) => {
    set(locationAtom, (prev) => [
      ...(prev ?? []),
      {
        placeId: locationSuggestion.userData.placeId,
        address:
          locationSuggestion.userData.suggestFirstRow +
          ', ' +
          locationSuggestion.userData.suggestSecondRow,
        shortAddress: locationSuggestion.userData.suggestFirstRow,
        latitude: locationSuggestion.userData.latitude,
        longitude: locationSuggestion.userData.longitude,
        radius: calculateViewportRadius(locationSuggestion.userData.viewport),
      },
    ])
  }
)

export const setClubsInFilterActionAtom = atom(
  null,
  (get, set, filterClubsUuids: readonly ClubUuid[] | undefined) => {
    const clubsWithMembers = get(clubsWithMembersAtom)
    const myClubsUuids = clubsWithMembers.map((club) => club.club.uuid)

    if (filterClubsUuids) {
      // user can leave the club but UUID can be still in the filter storage
      // we need to clean that up
      set(clubsUuidsFilterAtom, () =>
        filterClubsUuids.filter((uuid) => myClubsUuids.includes(uuid))
      )
    } else {
      set(clubsUuidsFilterAtom, undefined)
    }
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
    set(
      amountFilterEnabledBaseAtom,
      filterValue.amountBottomLimit !== undefined ||
        filterValue.amountTopLimit !== undefined
    )
    set(amountBottomLimitAtom, filterValue.amountBottomLimit)
    set(amountTopLimitAtom, filterValue.amountTopLimit)
    set(spokenLanguagesAtom, filterValue.spokenLanguages)
    set(singlePriceAtom, filterValue.singlePrice)
    set(singlePriceCurrencyAtom, filterValue.singlePriceCurrency)
    set(
      intendedConnectionLevelAtom,
      filterValue.friendLevel
        ? filterValue.friendLevel.includes('SECOND_DEGREE')
          ? 'ALL'
          : 'FIRST'
        : undefined
    )
    set(productCategoriesAtom, filterValue.productCategories)
    set(satsValueAtom, 0)
  }
)

const setFilterAtomsActionAtom = atom(
  null,
  (get, set, filterValue: OffersFilter) => {
    set(filterBarOptionsAtom, filterValue.filterBarOptions)
    set(sortingAtom, filterValue.sort)
    set(
      clubsFilterEnabledBaseAtom,
      filterValue.clubsUuids !== undefined && filterValue.clubsUuids.length > 0
    )
    set(setClubsInFilterActionAtom, filterValue.clubsUuids)
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

    if (!filterFromStorage.currency) {
      const currency = get(defaultCurrencyAtom)
      set(updateCurrencyLimitsAtom, {currency})
    }
  }
)

export const resetFilterOmitTextFilterActionAtom = atom(null, (get, set) => {
  const {text, ...restOfOffersFilterInitialState} = offersFilterInitialState

  set(setFilterAtomsActionAtom, restOfOffersFilterInitialState)
})

function getDraftOffersFilter(get: Getter): OffersFilter {
  const {text} = get(offersFilterFromStorageAtom)

  return {
    sort: get(sortingAtom),
    filterBarOptions: get(filterBarOptionsAtom),
    currency: get(currencyAtom),
    location: get(locationAtom),
    locationState: get(locationStateAtom),
    paymentMethod: get(paymentMethodAtom),
    btcNetwork: get(btcNetworkAtom),
    friendLevel:
      get(intendedConnectionLevelAtom) === 'FIRST'
        ? ['FIRST_DEGREE']
        : get(intendedConnectionLevelAtom) === 'ALL'
          ? ['FIRST_DEGREE', 'SECOND_DEGREE']
          : undefined,
    spokenLanguages: get(spokenLanguagesAtom),
    amountBottomLimit: get(amountFilterEnabledAtom)
      ? get(amountBottomLimitAtom)
      : undefined,
    amountTopLimit: (() => {
      if (!get(amountFilterEnabledAtom)) return undefined
      const topLimit = get(amountTopLimitAtom)
      // Treat "at max" as unbounded so cross-currency offers created at their
      // currency's cap aren't filtered out after FX drift.
      if (
        topLimit === undefined ||
        topLimit >= get(maxAmountForFilterCurrencyAtom)
      ) {
        return undefined
      }
      return topLimit
    })(),
    singlePrice: get(singlePriceAtom),
    singlePriceCurrency: get(singlePriceCurrencyAtom),
    clubsUuids: get(clubsFilterEnabledAtom)
      ? get(clubsUuidsFilterAtom)
      : undefined,
    productCategories: get(productCategoriesAtom),
    text,
  }
}

export const saveFilterActionAtom = atom(null, (get, set) => {
  const marketplaceLayoutMode = get(marketplaceLayoutModeAtom)

  set(offersFilterFromStorageAtom, getDraftOffersFilter(get))

  if (marketplaceLayoutMode === 'map') {
    const location = get(locationAtom)

    if (location) {
      const oneLocation = location[0]
      const coordinates = location.map((one) => ({
        latitude: one.latitude,
        longitude: one.longitude,
      }))

      if (coordinates.length === 1 && oneLocation) {
        // this should avoid zooming too much on filtered location if there is only one
        set(
          animateToCoordinateActionAtom,
          getOfferLocationBorderPoints(oneLocation)
        )
      } else {
        set(animateToCoordinateActionAtom, coordinates)
      }
    } else set(clearRegionAndRefocusActionAtom)
  }
})

export const filteredOffersPreviewCountAtom = atom((get) => {
  const draftFilter = getDraftOffersFilter(get)
  const btcPriceWithState = get(btcPriceForOfferWithCurrencyAtom)

  const filterPriceInSats =
    draftFilter.singlePrice &&
    btcPriceWithState &&
    btcPriceWithState.state !== 'loading'
      ? calculatePriceInSats({
          price: draftFilter.singlePrice,
          currentBtcPrice: btcPriceWithState.btcPrice?.BTC ?? 0,
        })
      : null

  const offersAfterBarFilter = selectOffersByMarketplaceFilterBarOptions({
    offers: get(offersToSeeInMarketplaceAtom),
    selectedOptions: draftFilter.filterBarOptions,
  })

  const filteredOffers = filterMarketplaceOffers({
    offers: offersAfterBarFilter,
    filter: draftFilter,
    layoutMode: get(marketplaceLayoutModeAtom),
    filterPriceInSats,
    getBtcPriceForCurrency: (currency) =>
      get(createBtcPriceForCurrencyAtom(currency))?.btcPrice?.BTC,
  })

  const viewportToFilterBy = draftFilter.location
    ? radiusToViewport(
        pipe(
          draftFilter.location,
          Array.map((one) => ({
            point: {latitude: one.latitude, longitude: one.longitude},
            radius: one.radius,
          }))
        )
      )
    : undefined

  return filterOffersByViewport({
    offers: filteredOffers,
    viewport: viewportToFilterBy,
    includeOnlineOffers:
      shouldCombineOnlineOffersWithLocationFilter(draftFilter),
  }).length
})

export function createSelectClubInFilterAtom(
  clubWithMembersAtom: Atom<ClubWithMembers>
): WritableAtom<boolean, [SetStateAction<boolean>], void> {
  return atom(
    (get) =>
      get(clubsUuidsFilterAtom)?.includes(get(clubWithMembersAtom).club.uuid) ??
      false,
    (get, set, isSelected: SetStateAction<boolean>) => {
      const {club} = get(clubWithMembersAtom)

      const selected = getValueFromSetStateActionOfAtom(isSelected)(
        () => get(clubsUuidsFilterAtom)?.includes(club.uuid) ?? false
      )

      set(clubsUuidsFilterAtom, (value) => {
        const newValue = new Set(value)
        if (selected) newValue.add(club.uuid)
        else newValue.delete(club.uuid)

        const clubsUuidsInFilterArray = Array.fromIterable(newValue)

        return clubsUuidsInFilterArray.length > 0 ? clubsUuidsInFilterArray : []
      })
    }
  )
}
