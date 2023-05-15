import {createScope, molecule} from 'jotai-molecules'
import {atom} from 'jotai'
import {type OffersFilter} from '../../state/marketplace/domain'
import {
  type Currency,
  type IntendedConnectionLevel,
  type LocationState,
  type Sort,
} from '@vexl-next/domain/dist/general/offers'
import {focusAtom} from 'jotai-optics'

const offersFilterInitialState: OffersFilter = {
  sort: undefined,
  friendLevel: undefined,
  currency: undefined,
  location: undefined,
  locationState: undefined,
  paymentMethod: undefined,
  btcNetwork: undefined,
  amountBottomLimit: undefined,
  amountTopLimit: undefined,
}

export const offersFilterInitialStateSell: OffersFilter = {
  ...offersFilterInitialState,
  offerType: 'SELL',
}
export const offersFilterInitialStateBuy: OffersFilter = {
  ...offersFilterInitialState,
  offerType: 'BUY',
}

export const FilterOffersScope = createScope<OffersFilter>(
  offersFilterInitialStateSell
)

export const filterOffersMolecule = molecule((getMolecule, getScope) => {
  const filterScope = getScope(FilterOffersScope)
  const filterScopeAtom = atom(filterScope)

  const sortingAtom = atom<Sort | undefined>(undefined)

  const offerTypeAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('offerType')
  )

  const currencyAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('currency')
  )

  const updateCurrencyLimitsAtom = atom<
    null,
    [
      {
        currency: Currency | undefined
      }
    ],
    boolean
  >(null, (get, set, params) => {
    const {currency} = params
    set(currencyAtom, currency)
    set(amountBottomLimitAtom, get(amountBottomLimitUsdEurCzkAtom))
    set(
      amountTopLimitAtom,
      currency === 'CZK'
        ? get(amountTopLimitCzkAtom)
        : get(amountTopLimitUsdEurAtom)
    )
    return true
  })

  const updateLocationStatePaymentMethodAtom = atom<
    null,
    [
      {
        locationState: LocationState
      }
    ],
    boolean
  >(null, (get, set, params) => {
    const {locationState} = params
    set(locationStateAtom, locationState)
    set(
      paymentMethodAtom,
      locationState === 'ONLINE' ? ['BANK', 'REVOLUT'] : ['CASH']
    )
    set(locationAtom, [])
    return true
  })

  const locationStateAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('locationState')
  )

  const locationAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('location')
  )

  const btcNetworkAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('btcNetwork')
  )

  const paymentMethodAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('paymentMethod')
  )

  const amountBottomLimitAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('amountBottomLimit')
  )

  const amountTopLimitAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('amountTopLimit')
  )

  const amountBottomLimitUsdEurCzkAtom = atom<number>(0)
  const amountTopLimitUsdEurAtom = atom<number>(10000)
  const amountTopLimitCzkAtom = atom<number>(250000)

  const friendLevelAtom = focusAtom(filterScopeAtom, (optic) =>
    optic.prop('friendLevel')
  )

  const intendedConnectionLevelAtom = atom<IntendedConnectionLevel | undefined>(
    undefined
  )

  const filterAtom = atom<OffersFilter | undefined>(undefined)

  const setFilterAtom = atom(null, (get, set) => {
    const offersFilter = get(filterScopeAtom)
    const intendedConnectionLevel = get(intendedConnectionLevelAtom)
    const sorting = get(sortingAtom)

    set(filterAtom, {
      sort: sorting,
      offerType: offersFilter.offerType,
      currency: offersFilter.currency,
      location: offersFilter.location,
      locationState: offersFilter.locationState,
      paymentMethod: offersFilter.paymentMethod,
      btcNetwork: offersFilter.btcNetwork,
      friendLevel: !intendedConnectionLevel
        ? undefined
        : intendedConnectionLevel === 'FIRST'
        ? ['FIRST_DEGREE']
        : ['SECOND_DEGREE'],
      amountBottomLimit: offersFilter.amountBottomLimit,
      amountTopLimit: offersFilter.amountTopLimit,
    })
  })

  const resetFilterAtom = atom(null, (get, set) => {
    set(sortingAtom, undefined)
    set(filterAtom, undefined)
    set(intendedConnectionLevelAtom, undefined)
    set(filterScopeAtom, offersFilterInitialState)
  })

  return {
    filterAtom,
    offerTypeAtom,
    locationStateAtom,
    locationAtom,
    paymentMethodAtom,
    amountBottomLimitAtom,
    amountTopLimitAtom,
    amountBottomLimitUsdEurCzkAtom,
    amountTopLimitUsdEurAtom,
    amountTopLimitCzkAtom,
    btcNetworkAtom,
    friendLevelAtom,
    sortingAtom,
    currencyAtom,
    updateCurrencyLimitsAtom,
    intendedConnectionLevelAtom,
    resetFilterAtom,
    updateLocationStatePaymentMethodAtom,
    setFilterAtom,
  }
})
