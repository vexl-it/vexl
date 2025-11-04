import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
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
  return pipe(
    T.Do,
    T.map(() => {
      set(offerTypeAtom, 'SELL')
      set(selectedCurrencyCodeAtom, getDefaultCurrency())
    }),
    T.chain(() => set(refreshCurrentBtcPriceActionAtom)),
    T.map(() => {
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
  )
})
