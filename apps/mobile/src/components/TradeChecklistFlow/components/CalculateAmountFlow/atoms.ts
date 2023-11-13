import {atom, type PrimitiveAtom} from 'jotai'
import {type BtcOrSat, type TradePriceType} from '../../domain'
import {focusAtom} from 'jotai-optics'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {
  mainTradeCheckListStateAtom,
  offerForTradeChecklistAtom,
} from '../../atoms'
import {publicApiAtom} from '../../../../api'
import {pipe} from 'fp-ts/function'
import {AcceptedCurrency} from '@vexl-next/rest-api/dist/services/btcPrice'
import reportError from '../../../../utils/reportError'
import {replaceNonDecimalCharsInInput} from '../../utils'
import {getCurrentLocale} from '../../../../utils/localization/I18nProvider'

export const SATOSHIS_IN_BTC = 100_000_000
export const DECIMALS_FOR_BTC_VALUE = 8

export const mainCalculatedAmountStateAtom = focusAtom(
  mainTradeCheckListStateAtom,
  (o) => o.prop('CALCULATE_AMOUNT')
)

export const tradeBtcPriceAtom = atom<number>(0)
export const tradePriceTypeDialogVisibleAtom = atom<boolean>(false)
export const tradePriceTypeAtom = atom<TradePriceType>('live')
export const btcOrSatAtom = atom<BtcOrSat>('BTC')
export const premiumOrDiscountEnabledAtom = atom<boolean>(false)
export const btcInputValueAtom = atom<string>('')
export const btcAmountAtom = atom<number>(0)
export const fiatInputValueAtom = atom<string>('')

export const fiatAmountAtom = atom<number>(0)
export const feeAmountAtom = atom<number>(0)

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, feeAmount: number) => {
    const btcInputValue = Number(get(btcInputValueAtom))
    const appliedFee = get(feeAmountAtom)

    const btcValueWithoutFee = btcInputValue / (1 - appliedFee / 100)
    const locale = getCurrentLocale()

    set(
      btcInputValueAtom,
      replaceNonDecimalCharsInInput(
        (
          btcValueWithoutFee -
          btcValueWithoutFee * (feeAmount / 100)
        ).toLocaleString(locale, {
          maximumFractionDigits: DECIMALS_FOR_BTC_VALUE,
        })
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
  const offerForTradeChecklist = get(offerForTradeChecklistAtom)
  return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
})

export const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
  const api = get(publicApiAtom)
  const offerForTradeChecklist = get(offerForTradeChecklistAtom)
  const currency =
    AcceptedCurrency.parse(
      offerForTradeChecklist?.offerInfo?.publicPart?.currency?.toLowerCase()
    ) ?? 'usd'

  return pipe(
    api.btcPrice(currency),
    TE.match(
      (e) => {
        reportError('warn', 'Api Error fetching BTC price in offer currency', e)
        return 0
      },
      (r) => {
        set(tradeBtcPriceAtom, r)
        return r
      }
    )
  )
})

export const freezePriceActionAtom = atom(null, (get, set) => {
  return pipe(
    set(refreshCurrentBtcPriceActionAtom),
    T.map((btcPrice) => {
      set(tradePriceTypeAtom, 'frozen')
      set(btcInputValueAtom, '1')
      set(fiatInputValueAtom, `${btcPrice}`)
      set(applyFeeOnTradePriceTypeChangeActionAtom)
    })
  )
})

export const setLivePriceActionAtom = atom(null, (get, set) => {
  return pipe(
    set(refreshCurrentBtcPriceActionAtom),
    T.map((btcPrice) => {
      set(tradePriceTypeAtom, 'live')
      set(btcInputValueAtom, '1')
      set(fiatInputValueAtom, `${btcPrice}`)
      set(applyFeeOnTradePriceTypeChangeActionAtom)
    })
  )
})

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
      const locale = getCurrentLocale()

      set(
        btcValueAtom,
        btcOrSat === 'BTC'
          ? (numberValue / tradeBtcPrice - fee).toLocaleString(locale, {
              maximumFractionDigits: DECIMALS_FOR_BTC_VALUE,
            })
          : `${Math.round(
              (numberValue / tradeBtcPrice - fee) * SATOSHIS_IN_BTC
            )}`
      )
    } else {
      set(btcValueAtom, '')
    }
  }
)

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

export const saveButtonDisabledAtom = atom((get) => {
  const btcInputValue = get(btcInputValueAtom)
  const fiatInputValue = get(fiatInputValueAtom)

  return !btcInputValue || !fiatInputValue
})

export const syncCalculatedAmountDataStateWithMainStateActionAtom = atom(
  null,
  (get, set) => {
    const mainCalculatedAmountState = get(mainCalculatedAmountStateAtom)

    set(tradePriceTypeAtom, mainCalculatedAmountState.tradePriceType)
    set(btcOrSatAtom, mainCalculatedAmountState.btcOrSat)
  }
)

export const saveLocalCalculatedAmountDataStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const tradePriceType = get(tradePriceTypeAtom)
    const btcOrSat = get(btcOrSatAtom)
    const btcAmount = get(btcAmountAtom)
    const fiatAmount = get(fiatAmountAtom)
    const feeAmount = get(feeAmountAtom)
    const tradeBtcPrice = get(tradeBtcPriceAtom)

    set(mainCalculatedAmountStateAtom, {
      tradePriceType,
      btcOrSat,
      status: 'pending',
      btcPrice: tradeBtcPrice,
      btcAmount,
      fiatAmount,
      feeAmount,
    })
  }
)
