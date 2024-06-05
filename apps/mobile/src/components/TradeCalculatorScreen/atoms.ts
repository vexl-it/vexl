import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {
  DECIMALS_FOR_BTC_VALUE,
  SATOSHIS_IN_BTC,
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../state/currentBtcPriceAtoms'
import {removeTrailingZerosFromNumberString} from '../../utils/removeTrailingZerosFromNumberString'

export const tradeBtcPriceAtom = atom<number>(0)
export const tradePriceTypeDialogVisibleAtom = atom<boolean>(false)
export const tradePriceTypeAtom = atom<TradePriceType | undefined>(undefined)
export const btcOrSatAtom = atom<BtcOrSat>('BTC')
export const selectedCurrencyCodeAtom = atom<CurrencyCode | undefined>(
  undefined
)
export const premiumOrDiscountEnabledAtom = atom<boolean>(false)
export const btcInputValueAtom = atom<string>('')
export const fiatInputValueAtom = atom<string>('')

export const feeAmountAtom = atom<number>(0)

export const togglePremiumOrDiscountActionAtom = atom(
  (get) => get(premiumOrDiscountEnabledAtom),
  (get, set) => {
    set(premiumOrDiscountEnabledAtom, (prev) => !prev)
  }
)

export const btcOrSatsValueActionAtom = atom(
  (get) => get(btcOrSatAtom),
  (get, set, value: BtcOrSat) => {
    set(btcOrSatAtom, value)
  }
)

export const btcPriceCurrencyAtom = atom(
  (get) => get(selectedCurrencyCodeAtom) ?? 'USD',
  (get, set, currency: CurrencyCode) => {
    set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const calculateBtcValueOnFiatAmountChangeActionAtom = atom(
  null,
  (
    get,
    set,
    {
      automaticCalculationDisabled,
      fiatAmount,
    }: {
      automaticCalculationDisabled?: boolean
      fiatAmount: string
    }
  ) => {
    const tradeBtcPrice = get(tradeBtcPriceAtom)
    const btcOrSat = get(btcOrSatAtom)
    const feeAmount = get(feeAmountAtom)

    set(fiatInputValueAtom, fiatAmount)

    if (automaticCalculationDisabled) {
      return
    }

    if (!fiatAmount) {
      set(btcInputValueAtom, '')
      return
    }

    if (tradeBtcPrice) {
      const numberValue = Number(fiatAmount)
      const fee = (numberValue / tradeBtcPrice) * (feeAmount / 100)

      set(
        btcInputValueAtom,
        btcOrSat === 'BTC'
          ? removeTrailingZerosFromNumberString(
              (numberValue / tradeBtcPrice - fee).toFixed(
                DECIMALS_FOR_BTC_VALUE
              )
            )
          : `${Math.round(
              (numberValue / tradeBtcPrice - fee) * SATOSHIS_IN_BTC
            )}`
      )
    } else {
      set(btcInputValueAtom, '')
    }
  }
)

export const btcPriceForOfferWithStateAtom =
  createBtcPriceForCurrencyAtom(btcPriceCurrencyAtom)

export const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
  const btcPriceCurrency = get(btcPriceCurrencyAtom)
  const fiatInputValue = get(fiatInputValueAtom)

  return pipe(
    set(refreshBtcPriceActionAtom, btcPriceCurrency),
    T.map(() => {
      set(
        tradeBtcPriceAtom,
        (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
      )
      // we need to recalculate amount of BTC based on new btc price
      set(calculateBtcValueOnFiatAmountChangeActionAtom, {
        fiatAmount: fiatInputValue,
      })
    })
  )
})

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, feeAmount: number) => {
    const btcOrSat = get(btcOrSatAtom)
    const btcInputValue = Number(get(btcInputValueAtom))
    const appliedFee = get(feeAmountAtom)

    if (get(btcInputValueAtom)) {
      const btcValueWithoutFee = btcInputValue / (1 - appliedFee / 100)
      const btcValueWithFeeApplied =
        btcValueWithoutFee - btcValueWithoutFee * (feeAmount / 100)

      set(
        btcInputValueAtom,
        btcOrSat === 'SAT'
          ? String(Math.round(btcValueWithFeeApplied))
          : removeTrailingZerosFromNumberString(
              btcValueWithFeeApplied.toFixed(DECIMALS_FOR_BTC_VALUE)
            )
      )
    }
    set(feeAmountAtom, feeAmount)
  }
)
