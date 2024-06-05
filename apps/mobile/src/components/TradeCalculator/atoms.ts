import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  TradePriceType,
  type BtcOrSat,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {createScope, molecule} from 'bunshi/.'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {
  DECIMALS_FOR_BTC_VALUE,
  SATOSHIS_IN_BTC,
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../state/currentBtcPriceAtoms'
import {removeTrailingZerosFromNumberString} from '../../utils/removeTrailingZerosFromNumberString'

const TradeCalculatorState = z.object({
  tradePriceType: TradePriceType,
  selectedCurrencyCode: CurrencyCode.optional(),
  btcInputValue: z.string(),
  fiatInputValue: z.string(),
  feeAmount: z.number(),
  tradeBtcPrice: z.number(),
})
export type TradeCalculatorState = z.TypeOf<typeof TradeCalculatorState>

export const tradeCalculatorInitialState: TradeCalculatorState = {
  tradePriceType: 'live',
  selectedCurrencyCode: 'USD',
  btcInputValue: '',
  fiatInputValue: '',
  feeAmount: 0,
  tradeBtcPrice: 0,
}

export const TradeCalculatorScope = createScope(
  atom<TradeCalculatorState>(tradeCalculatorInitialState)
)

export const tradeCalculatorMolecule = molecule((_, getScope) => {
  const tradeCalculatorStateAtom = getScope(TradeCalculatorScope)

  const tradePriceTypeDialogVisibleAtom = atom<boolean>(false)

  const btcOrSatAtom = atom<BtcOrSat>('BTC')
  const tradeBtcPriceAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('tradeBtcPrice')
  )

  const tradePriceTypeAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('tradePriceType')
  )

  const selectedCurrencyCodeAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('selectedCurrencyCode')
  )

  const btcInputValueAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('btcInputValue')
  )

  const fiatInputValueAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('fiatInputValue')
  )

  const feeAmountAtom = focusAtom(tradeCalculatorStateAtom, (o) =>
    o.prop('feeAmount')
  )

  const ownPriceAtom = atom<string | undefined>(undefined)

  const ownPriceSaveButtonDisabledAtom = atom((get) => !get(ownPriceAtom))

  const premiumOrDiscountEnabledAtom = atom<boolean>(false)

  const togglePremiumOrDiscountActionAtom = atom(
    (get) => get(feeAmountAtom) !== 0 || get(premiumOrDiscountEnabledAtom),
    (get, set) => {
      const premiumOrDicsountEnabled = get(premiumOrDiscountEnabledAtom)

      set(premiumOrDiscountEnabledAtom, !premiumOrDicsountEnabled)
    }
  )

  const saveButtonDisabledAtom = atom(
    (get) => !get(btcInputValueAtom) || !get(fiatInputValueAtom)
  )

  const btcPriceCurrencyAtom = atom(
    (get) => get(selectedCurrencyCodeAtom) ?? 'USD',
    (get, set, currency: CurrencyCode) => {
      set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
      void set(refreshCurrentBtcPriceActionAtom)()
    }
  )

  const btcPriceForOfferWithStateAtom =
    createBtcPriceForCurrencyAtom(btcPriceCurrencyAtom)

  const calculateBtcValueAfterBtcPriceRefreshActionAtom = atom(
    null,
    (get, set) => {
      const btcOrSat = get(btcOrSatAtom)
      const feeAmount = get(feeAmountAtom)
      const refreshedBtcPrice = get(btcPriceForOfferWithStateAtom)?.btcPrice
      const numberValue = Number(get(fiatInputValueAtom))

      if (refreshedBtcPrice) {
        const fee = (numberValue / refreshedBtcPrice) * (feeAmount / 100)

        set(tradeBtcPriceAtom, (prev) => refreshedBtcPrice ?? prev)

        set(
          btcInputValueAtom,
          btcOrSat === 'BTC'
            ? removeTrailingZerosFromNumberString(
                (numberValue / get(tradeBtcPriceAtom) - fee).toFixed(
                  DECIMALS_FOR_BTC_VALUE
                )
              )
            : `${Math.round(
                (numberValue / get(tradeBtcPriceAtom) - fee) * SATOSHIS_IN_BTC
              )}`
        )
      }
    }
  )

  const calculateBtcValueOnFiatAmountChangeActionAtom = atom(
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

  const calculateFiatValueOnBtcAmountChangeActionAtom = atom(
    null,
    (
      get,
      set,
      {
        automaticCalculationDisabled,
        btcAmount,
      }: {
        automaticCalculationDisabled?: boolean
        btcAmount: string
      }
    ) => {
      const tradeBtcPrice = get(tradeBtcPriceAtom)
      const btcOrSat = get(btcOrSatAtom)
      const feeAmount = get(feeAmountAtom)

      set(btcInputValueAtom, btcAmount)

      if (automaticCalculationDisabled) {
        return
      }

      if (!btcAmount) {
        set(fiatInputValueAtom, '')
        return
      }

      if (tradeBtcPrice) {
        const numberValue =
          btcOrSat === 'BTC'
            ? Number(btcAmount)
            : Number(btcAmount) / SATOSHIS_IN_BTC
        const fee = Math.round(tradeBtcPrice * numberValue) * (feeAmount / 100)
        set(
          fiatInputValueAtom,
          `${Math.round(tradeBtcPrice * numberValue + fee)}`
        )
      } else {
        set(fiatInputValueAtom, '')
      }
    }
  )

  const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
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

  const switchBtcOrSatValueActionAtom = atom(
    null,
    (get, set, value: BtcOrSat) => {
      const btcValue = get(btcInputValueAtom)

      set(btcOrSatAtom, value)
      if (btcValue) {
        set(
          btcInputValueAtom,
          value === 'BTC'
            ? `${Number(btcValue) / SATOSHIS_IN_BTC}`
            : `${Math.round(Number(btcValue) * SATOSHIS_IN_BTC)}`
        )
      }
    }
  )

  const updateFiatCurrencyActionAtom = atom(
    null,
    (get, set, currency: CurrencyCode) => {
      set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
      void set(refreshCurrentBtcPriceActionAtom)()
    }
  )

  const applyFeeOnFeeChangeActionAtom = atom(
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

  const applyFeeOnTradePriceTypeChangeActionAtom = atom(null, (get, set) => {
    const btcInputValue = Number(get(btcInputValueAtom))
    const feeAmount = get(feeAmountAtom)

    if (get(btcInputValueAtom)) {
      set(
        btcInputValueAtom,
        removeTrailingZerosFromNumberString(
          (btcInputValue - btcInputValue * (feeAmount / 100)).toFixed(
            DECIMALS_FOR_BTC_VALUE
          )
        )
      )
    }
  })

  const setFormDataBasedOnBtcPriceTypeActionAtom = atom(
    null,
    (get, set, tradePriceType: TradePriceType) => {
      return pipe(
        set(refreshCurrentBtcPriceActionAtom),
        T.map(() => {
          set(tradePriceTypeAtom, tradePriceType)
          set(
            tradeBtcPriceAtom,
            (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
          )
          set(applyFeeOnTradePriceTypeChangeActionAtom)
        })
      )
    }
  )

  const saveYourPriceActionAtom = atom(null, (get, set) => {
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

  return {
    btcOrSatAtom,
    tradePriceTypeAtom,
    selectedCurrencyCodeAtom,
    tradePriceTypeDialogVisibleAtom,
    saveYourPriceActionAtom,
    btcInputValueAtom,
    fiatInputValueAtom,
    feeAmountAtom,
    ownPriceAtom,
    ownPriceSaveButtonDisabledAtom,
    premiumOrDiscountEnabledAtom,
    saveButtonDisabledAtom,
    btcPriceForOfferWithStateAtom,
    calculateBtcValueAfterBtcPriceRefreshActionAtom,
    calculateBtcValueOnFiatAmountChangeActionAtom,
    calculateFiatValueOnBtcAmountChangeActionAtom,
    refreshCurrentBtcPriceActionAtom,
    btcPriceCurrencyAtom,
    switchBtcOrSatValueActionAtom,
    updateFiatCurrencyActionAtom,
    applyFeeOnFeeChangeActionAtom,
    applyFeeOnTradePriceTypeChangeActionAtom,
    setFormDataBasedOnBtcPriceTypeActionAtom,
    tradeBtcPriceAtom,
    tradeCalculatorStateAtom,
    togglePremiumOrDiscountActionAtom,
  }
})
