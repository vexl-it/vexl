import {
  type ListingType,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import getDefaultCurrency from '../../utils/getDefaultCurrency'
import {
  applyFeeOnTradePriceTypeChangeActionAtom,
  btcInputValueAtom,
  btcPriceForOfferWithStateAtom,
  calculateBtcValueOnFiatAmountChangeActionAtom,
  calculateFiatValueOnBtcAmountChangeActionAtom,
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
export const ownPriceSaveButtonDisabledAtom = atom((get) => !get(ownPriceAtom))

export const saveYourPriceActionAtom = atom(null, (get, set) => {
  const ownPrice = get(ownPriceAtom)

  if (ownPrice) {
    set(tradeBtcPriceAtom, Number(ownPrice))
  }

  set(calculateBtcValueOnFiatAmountChangeActionAtom, {
    fiatAmount: get(fiatInputValueAtom),
  })

  set(tradePriceTypeAtom, 'your')
  set(applyFeeOnTradePriceTypeChangeActionAtom)
})

export const resetTradeCalculatorStateActionAtom = atom(null, (get, set) => {
  return pipe(
    T.Do,
    T.map(() => {
      set(offerTypeAtom, 'SELL')
      set(selectedCurrencyCodeAtom, getDefaultCurrency().code)
    }),
    T.chain(() => set(refreshCurrentBtcPriceActionAtom)),
    T.map(() => {
      set(tradePriceTypeAtom, 'live')
      set(
        tradeBtcPriceAtom,
        (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
      )
      set(btcInputValueAtom, '')
      set(calculateFiatValueOnBtcAmountChangeActionAtom, {
        btcAmount: '0',
      })

      set(premiumOrDiscountEnabledAtom, false)
      set(feeAmountAtom, 0)
    })
  )
})
