import {type Atom, atom, type SetStateAction, type WritableAtom} from 'jotai'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {currencies} from '../../utils/localization/currency'
import {
  type BtcNetwork,
  type IntendedConnectionLevel,
  type Location,
  type LocationState,
  type PaymentMethod,
  type Sort,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {splitAtom} from 'jotai/utils'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {
  type GetLocationSuggestionsRequest,
  type LocationSuggestion,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {pipe} from 'fp-ts/function'
import {fetchLocationSuggestionsAtom} from '../../state/location/atoms/fetchLocationSuggestionsAtom'
import * as T from 'fp-ts/Task'
import {type OffersFilter} from '../../state/marketplace/domain'
import {
  offersFilterFromStorageAtom,
  offersFilterInitialState,
} from '../../state/marketplace/filterAtoms'

export const currencyAtom = atom<CurrencyCode | undefined>(
  offersFilterInitialState.currency
)

const spokenLanguagesAtom = atom<SpokenLanguage[]>(
  offersFilterInitialState.spokenLanguages
)
export const spokenLanguagesAtomsAtom = splitAtom(spokenLanguagesAtom)

export const sortingAtom = atom<Sort | undefined>(undefined)

export const intendedConnectionLevelAtom = atom<IntendedConnectionLevel>('ALL')

export const locationStateAtom = atom<LocationState | undefined>(
  offersFilterInitialState.locationState
)

export const locationAtom = atom<Location[] | undefined>(
  offersFilterInitialState.location
)

export const btcNetworkAtom = atom<BtcNetwork[] | undefined>(
  offersFilterInitialState.btcNetwork
)

export const paymentMethodAtom = atom<PaymentMethod[] | undefined>(
  offersFilterInitialState.paymentMethod
)

export const amountBottomLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountBottomLimit
)

export const amountTopLimitAtom = atom<number | undefined>(
  offersFilterInitialState.amountTopLimit
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
  set(amountTopLimitAtom, currency ? currencies[currency].maxAmount : 0)

  return true
})

export const updateLocationStatePaymentMethodAtom = atom<
  null,
  [
    {
      locationState: LocationState
    },
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

export const focusTextFilterAtom = atom<string | undefined>(
  offersFilterInitialState.text
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

const setAllFilterAtomsActionAtom = atom(
  null,
  (get, set, filterValue: OffersFilter) => {
    set(focusTextFilterAtom, filterValue.text)
    set(sortingAtom, filterValue.sort)
    set(currencyAtom, filterValue.currency)
    set(locationAtom, filterValue.location)
    set(locationStateAtom, filterValue.locationState)
    set(paymentMethodAtom, filterValue.paymentMethod)
    set(btcNetworkAtom, filterValue.btcNetwork)
    set(amountBottomLimitAtom, filterValue.amountBottomLimit)
    set(amountTopLimitAtom, filterValue.amountTopLimit)
    set(spokenLanguagesAtom, filterValue.spokenLanguages)
    set(
      intendedConnectionLevelAtom,
      filterValue.friendLevel?.includes('SECOND_DEGREE') ? 'ALL' : 'FIRST'
    )
  }
)

export const initializeOffersFilterOnDisplayActionAtom = atom(
  null,
  (get, set) => {
    const filterFromStorage = get(offersFilterFromStorageAtom)

    set(setAllFilterAtomsActionAtom, filterFromStorage)
  }
)

export const resetFilterAtom = atom(null, (get, set) => {
  set(setAllFilterAtomsActionAtom, offersFilterInitialState)
})

export const saveFilterActionAtom = atom(null, (get, set) => {
  const newFilterValue: OffersFilter = {
    sort: get(sortingAtom),
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
    text: get(focusTextFilterAtom),
  }

  set(offersFilterFromStorageAtom, newFilterValue)
})
