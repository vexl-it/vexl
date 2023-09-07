import {atom, type Atom} from 'jotai'
import {type OffersFilter} from '../../state/marketplace/domain'
import {
  type CurrencyCode,
  type IntendedConnectionLevel,
  type LocationState,
  type Sort,
} from '@vexl-next/domain/dist/general/offers'
import {focusAtom} from 'jotai-optics'
import {
  offersFilterFromStorageAtom,
  offersFilterInitialState,
} from '../../state/offersFilter'
import {selectAtom, splitAtom} from 'jotai/utils'
import {currencies} from '../../utils/localization/currency'
import {
  type GetLocationSuggestionsRequest,
  type LocationSuggestion,
} from '@vexl-next/rest-api/dist/services/location/contracts'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import {fetchLocationSuggestionsAtom} from '../../state/location/atoms/fetchLocationSuggestionsAtom'

export const sortingAtom = atom<Sort | undefined>(undefined)
export const intendedConnectionLevelAtom = atom<IntendedConnectionLevel>('ALL')

export const isFilterActiveAtom = selectAtom(
  offersFilterFromStorageAtom,
  (offersFilterFromStorage) => {
    return (
      JSON.stringify(offersFilterFromStorage) !==
      JSON.stringify(offersFilterInitialState)
    )
  }
)

export const offersFilterAtom = atom<OffersFilter>(offersFilterInitialState)

export const setOffersFilterAtom = atom(null, (get, set) => {
  const filter = get(offersFilterFromStorageAtom)

  set(offersFilterAtom, filter)
  set(sortingAtom, filter.sort)
  set(
    intendedConnectionLevelAtom,
    filter.friendLevel?.includes('SECOND_DEGREE') ? 'ALL' : 'FIRST'
  )
})

export const focusTextFilterAtom = atom(
  (get) => get(offersFilterAtom).text,
  (get, set, value: string | undefined) => {
    set(offersFilterAtom, (o) => ({...o, text: value}))
    set(offersFilterFromStorageAtom, (o) => ({...o, text: value}))
  }
)
export const isTextFilterActiveAtom = selectAtom(focusTextFilterAtom, Boolean)

export const currencyAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('currency')
)

export const updateCurrencyLimitsAtom = atom<
  null,
  [
    {
      currency: CurrencyCode | undefined
    }
  ],
  boolean
>(null, (get, set, params) => {
  const {currency} = params

  set(currencyAtom, currency)
  set(amountBottomLimitAtom, 0)
  set(amountTopLimitAtom, currency ? currencies[currency].maxAmount : 0)

  return true
})

export const updateLocationStatePaymentMethodAtom = atom<
  null,
  [
    {
      locationState: LocationState
    }
  ],
  boolean
>(null, (get, set, params) => {
  const {locationState} = params
  const locationStateFromAtom = get(locationStateAtom)

  if (locationState === locationStateFromAtom) {
    set(locationStateAtom, undefined)
    set(paymentMethodAtom, undefined)
    set(locationAtom, undefined)
  } else {
    set(locationStateAtom, locationState)
    set(
      paymentMethodAtom,
      locationState === 'ONLINE' ? ['BANK', 'REVOLUT'] : ['CASH']
    )
    set(locationAtom, [])
  }

  return true
})

export const locationStateAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('locationState')
)

export const locationAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('location')
)

export const btcNetworkAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('btcNetwork')
)

export const paymentMethodAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('paymentMethod')
)

export const amountBottomLimitAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('amountBottomLimit')
)

export const amountTopLimitAtom = focusAtom(offersFilterAtom, (optic) =>
  optic.prop('amountTopLimit')
)

export const locationSuggestionsAtom = atom<LocationSuggestion[]>([])

export const locationSuggestionsAtomsAtom = splitAtom(locationSuggestionsAtom)

export const updateAndRefreshLocationSuggestionsActionAtom = atom(
  null,
  (get, set, request: GetLocationSuggestionsRequest) => {
    return pipe(
      set(fetchLocationSuggestionsAtom, request),
      T.map((result) => {
        set(locationSuggestionsAtom, result.result)
      })
    )()
  }
)

export const setOfferLocationActionAtom = atom(
  null,
  (get, set, locationSuggestionAtom: Atom<LocationSuggestion>) => {
    const location = get(locationAtom)
    const locationSuggestion = get(locationSuggestionAtom)

    if (
      !location?.some(
        (offerLocation) =>
          offerLocation.city === locationSuggestion.userData.suggestFirstRow
      )
    ) {
      set(locationAtom, [
        ...(location ?? []),
        {
          latitude: String(locationSuggestion.userData.latitude),
          longitude: String(locationSuggestion.userData.longitude),
          city: locationSuggestion.userData.suggestFirstRow,
        },
      ])
    }
  }
)

export const saveFilterActionAtom = atom(null, (get, set) => {
  const offersFilter = get(offersFilterAtom)
  const intendedConnectionLevel = get(intendedConnectionLevelAtom)
  const sorting = get(sortingAtom)
  const newFilterValue: OffersFilter = {
    sort: sorting,
    offerType: offersFilter.offerType,
    currency: offersFilter.currency,
    location: offersFilter.location,
    locationState: offersFilter.locationState,
    paymentMethod: offersFilter.paymentMethod,
    btcNetwork: offersFilter.btcNetwork,
    friendLevel:
      intendedConnectionLevel === 'FIRST'
        ? ['FIRST_DEGREE']
        : ['FIRST_DEGREE', 'SECOND_DEGREE'],
    amountBottomLimit: offersFilter.amountBottomLimit,
    amountTopLimit: offersFilter.amountTopLimit,
    text: offersFilter.text,
  }

  set(offersFilterFromStorageAtom, newFilterValue)
})

export const resetFilterAtom = atom(null, (get, set) => {
  set(sortingAtom, undefined)
  set(intendedConnectionLevelAtom, 'ALL')
  set(offersFilterAtom, offersFilterInitialState)
})
