import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import getDefaultCurrency from '../../utils/getDefaultCurrency'
import {
  amountInputsSwappedAtom,
  btcInputValueAtom,
  btcOrSatAtom,
  btcPriceForOfferWithStateAtom,
  feeAmountAtom,
  fiatInputValueAtom,
  ownPriceAtom,
  premiumOrDiscountEnabledAtom,
  refreshCurrentBtcPriceActionAtom,
  selectedCurrencyCodeAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../TradeCalculator/atoms'

export const listingTypeAtom = atom<ListingType | undefined>('BITCOIN')
export const offerTypeAtom = atom<OfferType | undefined>('SELL')

export const resetTradeCalculatorStateActionAtom = atom(null, (get, set) => {
  return pipe(
    T.Do,
    T.map(() => {
      const defaultCurrency = getDefaultCurrency()

      set(listingTypeAtom, 'BITCOIN')
      set(offerTypeAtom, 'SELL')
      set(selectedCurrencyCodeAtom, defaultCurrency)
      set(tradePriceTypeAtom, 'live')
      set(btcInputValueAtom, '')
      set(fiatInputValueAtom, '')
      set(premiumOrDiscountEnabledAtom, false)
      set(feeAmountAtom, 0)
      set(btcOrSatAtom, 'BTC')
      set(amountInputsSwappedAtom, false)
      set(ownPriceAtom, undefined)
    }),
    T.chain(() => set(refreshCurrentBtcPriceActionAtom)),
    T.map(() => {
      set(
        tradeBtcPriceAtom,
        (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ?? prev
      )
      set(btcInputValueAtom, '')
      set(fiatInputValueAtom, '')
    })
  )
})
