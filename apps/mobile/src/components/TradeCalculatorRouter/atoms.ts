import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {atom} from 'jotai'
import getDefaultCurrency from '../../utils/getDefaultCurrency'
import {
  btcInputValueAtom,
  btcPriceForOfferWithStateAtom,
  calculateFiatValueOnBtcAmountChangeActionAtom,
  feeAmountAtom,
  premiumOrDiscountEnabledAtom,
  refreshCurrentBtcPriceActionAtom,
  selectedCurrencyCodeAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../TradeCalculator/atoms'

export const listingTypeAtom = atom<ListingType | undefined>('BITCOIN')
export const offerTypeAtom = atom<OfferType | undefined>('SELL')

export const resetTradeCalculatorStateActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    set(offerTypeAtom, 'SELL')
    set(selectedCurrencyCodeAtom, getDefaultCurrency())

    yield* _(set(refreshCurrentBtcPriceActionAtom))

    set(tradePriceTypeAtom, 'live')
    set(
      tradeBtcPriceAtom,
      (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ?? prev
    )
    set(btcInputValueAtom, '')
    set(calculateFiatValueOnBtcAmountChangeActionAtom, {
      btcAmount: 0,
    })

    set(premiumOrDiscountEnabledAtom, false)
    set(feeAmountAtom, 0)
  })
})
