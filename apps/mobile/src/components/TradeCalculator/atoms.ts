import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {
  SATOSHIS_IN_BTC,
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../state/currentBtcPriceAtoms'
import {tradeOrOriginOfferCurrencyAtom} from '../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  applyFeeOnNumberValue,
  cancelFeeOnNumberValue,
  formatBtcPrice,
} from '../../state/tradeChecklist/utils/amount'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {
  addThousandsSeparatorSpacesToNumberInput,
  removeThousandsSeparatorSpacesFromNumberInput,
} from './utils'

export const currencySelectVisibleAtom = atom<boolean>(false)
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

export const ownPriceAtom = atom<string | undefined>(undefined)

export const ownPriceSaveButtonDisabledAtom = atom((get) => !get(ownPriceAtom))

export const btcPriceCurrencyAtom = atom(
  (get) =>
    get(selectedCurrencyCodeAtom) ??
    get(tradeOrOriginOfferCurrencyAtom) ??
    'USD',
  (get, set, currency: CurrencyCode) => {
    set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const btcPriceForOfferWithStateAtom =
  createBtcPriceForCurrencyAtom(btcPriceCurrencyAtom)

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, newFee: number) => {
    const fiatInputValue = Number(
      removeThousandsSeparatorSpacesFromNumberInput(get(fiatInputValueAtom))
    )
    const previousAppliedFee = get(feeAmountAtom)

    const fiatValueWithoutPreviousFee = cancelFeeOnNumberValue(
      fiatInputValue,
      previousAppliedFee
    )
    const fiatValueWithNewFeeApplied = applyFeeOnNumberValue(
      fiatValueWithoutPreviousFee,
      newFee
    )

    set(
      fiatInputValueAtom,
      addThousandsSeparatorSpacesToNumberInput(
        String(Math.round(fiatValueWithNewFeeApplied))
      )
    )
    set(feeAmountAtom, newFee)
  }
)

export const saveYourPriceActionAtom = atom(null, (get, set) => {
  const ownPrice = get(ownPriceAtom)

  if (ownPrice) {
    set(tradeBtcPriceAtom, Number(ownPrice))
  }
  set(calculateFiatValueOnBtcAmountChangeActionAtom, {
    btcAmount: get(btcInputValueAtom),
  })

  set(tradePriceTypeAtom, 'your')
})

export const applyFeeOnTradePriceTypeChangeActionAtom = atom(
  null,
  (get, set) => {
    const fiatInputValue = Number(
      removeThousandsSeparatorSpacesFromNumberInput(get(fiatInputValueAtom))
    )
    const feeAmount = get(feeAmountAtom)

    set(
      fiatInputValueAtom,
      addThousandsSeparatorSpacesToNumberInput(
        String(Math.round(applyFeeOnNumberValue(fiatInputValue, feeAmount)))
      )
    )
  }
)

export const setFormDataBasedOnBtcPriceTypeActionAtom = atom(
  null,
  (get, set, tradePriceType: TradePriceType) => {
    return pipe(
      set(refreshCurrentBtcPriceActionAtom),
      T.map(() => {
        set(tradePriceTypeAtom, tradePriceType)
        set(
          tradeBtcPriceAtom,
          (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ?? prev
        )
      })
    )
  }
)

export const calculateFiatValueAfterBtcPriceRefreshActionAtom = atom(
  null,
  (get, set) => {
    const feeAmount = get(feeAmountAtom)
    const refreshedBtcPrice = get(btcPriceForOfferWithStateAtom)?.btcPrice

    if (refreshedBtcPrice) {
      const btcInputValue = Number(get(btcInputValueAtom))
      const btcOrSat = get(btcOrSatAtom)
      const btcValue =
        btcOrSat === 'SAT' ? btcInputValue / SATOSHIS_IN_BTC : btcInputValue
      const fiatAmount = btcValue * refreshedBtcPrice.BTC

      set(tradeBtcPriceAtom, (prev) => refreshedBtcPrice.BTC ?? prev)

      set(
        fiatInputValueAtom,
        String(Math.round(applyFeeOnNumberValue(fiatAmount, feeAmount)))
      )
    }
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

      set(
        fiatInputValueAtom,
        String(
          Math.round(
            applyFeeOnNumberValue(tradeBtcPrice * numberValue, feeAmount)
          )
        )
      )
    } else {
      set(fiatInputValueAtom, '')
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
      const adjustedFiatAmount = cancelFeeOnNumberValue(
        Number(fiatAmount),
        feeAmount
      )
      const btcAmount = adjustedFiatAmount / tradeBtcPrice

      set(
        btcInputValueAtom,
        btcOrSat === 'BTC'
          ? formatBtcPrice(btcAmount)
          : `${Math.round(btcAmount * SATOSHIS_IN_BTC)}`
      )
    } else {
      set(btcInputValueAtom, '')
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
        (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ?? prev
      )
      // we need to recalculate fiat amount based on new btc price
      set(calculateFiatValueOnBtcAmountChangeActionAtom, {
        btcAmount: btcInputValue,
      })
    })
  )
})

export const switchBtcOrSatValueActionAtom = atom(null, (get, set) => {
  const btcValue = get(btcInputValueAtom)

  set(btcOrSatAtom, (prev) => (prev === 'BTC' ? 'SAT' : 'BTC'))
  if (btcValue) {
    set(
      btcInputValueAtom,
      get(btcOrSatAtom) === 'BTC'
        ? `${Number(btcValue) / SATOSHIS_IN_BTC}`
        : `${Math.round(Number(btcValue) * SATOSHIS_IN_BTC)}`
    )
  }
})

export const updateFiatCurrencyActionAtom = atom(
  null,
  (get, set, currency: CurrencyCode) => {
    set(selectedCurrencyCodeAtom, CurrencyCode.parse(currency))
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const liveTradePriceExplanationAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithText',
          title: t('tradeCalculator.whatDoesLivePriceMean'),
          description: t('tradeCalculator.yadioLivePriceExplanation'),
          positiveButtonText: t('common.gotIt'),
        },
      ],
    }),
    TE.match(
      () => {},
      () => {}
    )
  )()
})
