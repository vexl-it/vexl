import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type AmountData,
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {
  DECIMALS_FOR_BTC_VALUE,
  SATOSHIS_IN_BTC,
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../../state/currentBtcPriceAtoms'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  tradeChecklistAmountDataAtom,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {removeTrailingZerosFromNumberString} from '../../../../utils/removeTrailingZerosFromNumberString'
import updatesToBeSentAtom, {
  addAmountActionAtom,
} from '../../atoms/updatesToBeSentAtom'
import {replaceNonDecimalCharsInInput} from '../../utils'

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

export const btcPriceCurrencyAtom = atom(
  (get) =>
    get(selectedCurrencyCodeAtom) ??
    get(tradeOrOriginOfferCurrencyAtom) ??
    'USD'
)

export const btcPriceForOfferWithStateAtom =
  createBtcPriceForCurrencyAtom(btcPriceCurrencyAtom)

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, feeAmount: number) => {
    const btcOrSat = get(btcOrSatAtom)
    const btcInputValue = Number(get(btcInputValueAtom))
    const appliedFee = get(feeAmountAtom)

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
    set(feeAmountAtom, feeAmount)
  }
)

export const applyFeeOnTradePriceTypeChangeActionAtom = atom(
  null,
  (get, set) => {
    const btcInputValue = Number(get(btcInputValueAtom))
    const feeAmount = get(feeAmountAtom)

    set(
      btcInputValueAtom,
      replaceNonDecimalCharsInInput(
        `${btcInputValue - btcInputValue * (feeAmount / 100)}`
      )
    )
  }
)

export const saveYourPriceActionAtom = atom(
  null,
  (
    get,
    set,
    {
      btcValueAtom,
      fiatValueAtom,
    }: {
      btcValueAtom: PrimitiveAtom<string>
      fiatValueAtom: PrimitiveAtom<string>
    }
  ) => {
    const fiatValue = get(fiatValueAtom)
    const btcValue = get(btcValueAtom)

    if (fiatValue) {
      set(tradeBtcPriceAtom, Number(fiatValue))
      set(fiatInputValueAtom, fiatValue)
    }

    if (btcValue) set(btcInputValueAtom, btcValue)

    set(tradePriceTypeAtom, 'your')
    set(applyFeeOnTradePriceTypeChangeActionAtom)
  }
)

export const offerTypeAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
})

export const setFormDataBasedOnBtcPriceTypeActionAtom = atom(
  null,
  (get, set, tradePriceType: TradePriceType) => {
    const btcOrSat = get(btcOrSatAtom)
    return pipe(
      set(refreshCurrentBtcPriceActionAtom),
      T.map(() => {
        set(tradePriceTypeAtom, tradePriceType)
        set(btcInputValueAtom, btcOrSat === 'BTC' ? '1' : '100000000')
        set(
          fiatInputValueAtom,
          `${get(btcPriceForOfferWithStateAtom)?.btcPrice}`
        )
        set(
          tradeBtcPriceAtom,
          (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
        )
        set(applyFeeOnTradePriceTypeChangeActionAtom)
      })
    )
  }
)

export const calculateFiatValueOnBtcAmountChangeActionAtom = atom(
  null,
  (
    get,
    set,
    {
      automaticCalculationDisabled,
      btcAmount,
      btcValueAtom,
      fiatValueAtom,
    }: {
      automaticCalculationDisabled?: boolean
      btcAmount: string
      btcValueAtom: PrimitiveAtom<string>
      fiatValueAtom: PrimitiveAtom<string>
    }
  ) => {
    const tradeBtcPrice = get(tradeBtcPriceAtom)
    const btcOrSat = get(btcOrSatAtom)
    const feeAmount = get(feeAmountAtom)

    set(btcValueAtom, btcAmount)

    if (automaticCalculationDisabled) {
      return
    }

    if (!btcAmount) {
      set(fiatValueAtom, '')
      return
    }

    if (tradeBtcPrice) {
      const numberValue =
        btcOrSat === 'BTC'
          ? Number(btcAmount)
          : Number(btcAmount) / SATOSHIS_IN_BTC
      const fee = Math.round(tradeBtcPrice * numberValue) * (feeAmount / 100)
      set(fiatValueAtom, `${Math.round(tradeBtcPrice * numberValue + fee)}`)
    } else {
      set(fiatValueAtom, '')
    }
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
      btcValueAtom,
      fiatValueAtom,
    }: {
      automaticCalculationDisabled?: boolean
      fiatAmount: string
      btcValueAtom: PrimitiveAtom<string>
      fiatValueAtom: PrimitiveAtom<string>
    }
  ) => {
    const tradeBtcPrice = get(tradeBtcPriceAtom)
    const btcOrSat = get(btcOrSatAtom)
    const feeAmount = get(feeAmountAtom)

    set(fiatValueAtom, fiatAmount)

    if (automaticCalculationDisabled) {
      return
    }

    if (!fiatAmount) {
      set(btcValueAtom, '')
      return
    }

    if (tradeBtcPrice) {
      const numberValue = Number(fiatAmount)
      const fee = (numberValue / tradeBtcPrice) * (feeAmount / 100)

      set(
        btcValueAtom,
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
      set(btcValueAtom, '')
    }
  }
)

export const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
  const btcPriceCurrency = get(btcPriceCurrencyAtom)
  const btcInputValue = get(btcInputValueAtom)

  return pipe(
    set(refreshBtcPriceActionAtom, btcPriceCurrency),
    T.map(() => {
      set(
        tradeBtcPriceAtom,
        (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
      )
      // we need to recalculate amount of fiat based on new btc price
      // TODO: rewrite this to use get() on atoms directly in calculateFiatValueOnBtcAmountChangeActionAtom
      set(calculateFiatValueOnBtcAmountChangeActionAtom, {
        btcAmount: btcInputValue,
        btcValueAtom: btcInputValueAtom,
        fiatValueAtom: fiatInputValueAtom,
      })
    })
  )
})

export const toggleBtcOrSatValueActionAtom = atom(
  null,
  (get, set, value: BtcOrSat) => {
    const btcValue = get(btcInputValueAtom)

    set(btcOrSatAtom, value)
    set(
      btcInputValueAtom,
      value === 'BTC'
        ? `${Number(btcValue) / SATOSHIS_IN_BTC}`
        : `${Math.round(Number(btcValue) * SATOSHIS_IN_BTC)}`
    )
  }
)

export const toggleFiatCurrencyActionAtom = atom(
  null,
  (get, set, currency: CurrencyCode) => {
    set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const saveButtonDisabledAtom = atom((get) => {
  const btcInputValue = get(btcInputValueAtom)
  const fiatInputValue = get(fiatInputValueAtom)

  return !btcInputValue || !fiatInputValue
})

export const isOtherSideAmountDataNewerThanMineAtom = atom((get) => {
  const tradeChecklistAmountData = get(tradeChecklistAmountDataAtom)
  const otherSideTimestampIsGreater =
    (tradeChecklistAmountData.received?.timestamp ?? 0) >
    (tradeChecklistAmountData.sent?.timestamp ?? 0)
  const tradePriceTypeDiffers =
    get(tradePriceTypeAtom) !==
    tradeChecklistAmountData.received?.tradePriceType
  const btcAmountDiffers =
    get(btcInputValueAtom) !==
    tradeChecklistAmountData.received?.btcAmount?.toString()
  const fiatAmountDiffers =
    get(fiatInputValueAtom) !==
    tradeChecklistAmountData.received?.fiatAmount?.toString()
  const feeDiffers =
    get(feeAmountAtom) !== tradeChecklistAmountData.received?.feeAmount

  return (
    otherSideTimestampIsGreater &&
    !get(updatesToBeSentAtom).amount &&
    !tradePriceTypeDiffers &&
    !btcAmountDiffers &&
    !fiatAmountDiffers &&
    !feeDiffers
  )
})

export const syncDataWithChatStateActionAtom = atom(
  null,
  (get, set, data: AmountData | undefined) => {
    const tradeOrOriginOfferCurrency = get(tradeOrOriginOfferCurrencyAtom)
    const updatesToBeSent = get(updatesToBeSentAtom)
    const initialDataToSet = updatesToBeSent.amount ?? data

    return pipe(
      set(refreshCurrentBtcPriceActionAtom),
      T.map(() => {
        set(tradePriceTypeAtom, initialDataToSet?.tradePriceType ?? 'live')
        set(btcInputValueAtom, String(initialDataToSet?.btcAmount ?? ''))
        set(fiatInputValueAtom, String(initialDataToSet?.fiatAmount ?? ''))
        set(
          tradeBtcPriceAtom,
          (prev) =>
            initialDataToSet?.btcPrice ??
            get(btcPriceForOfferWithStateAtom)?.btcPrice ??
            prev
        )

        set(
          premiumOrDiscountEnabledAtom,
          initialDataToSet?.feeAmount !== 0 ?? false
        )
        set(feeAmountAtom, initialDataToSet?.feeAmount ?? 0)
        set(
          selectedCurrencyCodeAtom,
          initialDataToSet?.currency ?? tradeOrOriginOfferCurrency
        )
      })
    )()
  }
)

export const saveLocalCalculatedAmountDataStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const tradePriceType = get(tradePriceTypeAtom)
    const btcAmount = Number(get(btcInputValueAtom))
    const fiatAmount = Number(get(fiatInputValueAtom))
    const feeAmount = get(feeAmountAtom)
    const btcPrice = get(tradeBtcPriceAtom)
    const currency = get(selectedCurrencyCodeAtom)

    set(addAmountActionAtom, {
      tradePriceType: tradePriceType === 'custom' ? 'your' : tradePriceType,
      btcAmount,
      fiatAmount,
      feeAmount,
      btcPrice,
      currency,
    })
  }
)
