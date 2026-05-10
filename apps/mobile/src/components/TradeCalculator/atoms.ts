import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Schema} from 'effect/index'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type Getter, type SetStateAction} from 'jotai'
import React from 'react'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../state/currentBtcPriceAtoms'
import {tradeOrOriginOfferCurrencyAtom} from '../../state/tradeChecklist/atoms/fromChatAtoms'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {globalDialogAtom} from '../GlobalDialog'
import TradePriceTypeDialogContent, {
  type SelectableTradePriceType,
} from './components/TradePriceTypeDialogContent'
import {
  calculateBtcFromFiat,
  calculateFiatFromBtc,
  cancelFee,
  changeBtcInput,
  changeBtcUnit,
  changeFee,
  changeFiatInput,
  disableFee,
  normalizeInputString,
  parseNormalizedInput,
  recalculateOppositeSide,
  resolveEffectiveBtcPrice,
  type CalculatorState,
} from './helpers'

export const calculatorStateAtom = atom<CalculatorState>({
  btcInput: '',
  fiatInput: '',
  btcUnit: 'BTC',
  fiatCurrency: undefined,
  feeAmount: 0,
  premiumOrDiscountEnabled: false,
  inputsSwapped: false,
  priceSource: 'live',
  fixedBtcPrice: undefined,
  manualPriceInput: undefined,
  lastEditedSide: 'btc',
})

export const selectedCurrencyCodeAtom = atom(
  (get) => get(calculatorStateAtom).fiatCurrency,
  (get, set, currency: CurrencyCode | undefined) => {
    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      fiatCurrency: currency,
    })
  }
)

export const btcPriceCurrencyAtom = atom(
  (get) =>
    get(selectedCurrencyCodeAtom) ??
    get(tradeOrOriginOfferCurrencyAtom) ??
    'USD',
  (get, set, currency: CurrencyCode) => {
    const decodedCurrency = Schema.decodeSync(CurrencyCode)(currency)

    set(selectedCurrencyCodeAtom, decodedCurrency)
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const btcPriceForOfferWithStateAtom =
  createBtcPriceForCurrencyAtom(btcPriceCurrencyAtom)

function getLiveBtcPrice(get: Getter): number | undefined {
  return get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC
}

export const tradeBtcPriceAtom = atom(
  (get) =>
    resolveEffectiveBtcPrice(get(calculatorStateAtom), getLiveBtcPrice(get))
      .price ?? 0,
  (get, set, price: number | SetStateAction<number>) => {
    const currentPrice =
      resolveEffectiveBtcPrice(get(calculatorStateAtom), getLiveBtcPrice(get))
        .price ?? 0
    const nextPrice = getValueFromSetStateActionOfAtom(price)(
      () => currentPrice
    )

    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      fixedBtcPrice: nextPrice,
    })
  }
)

export const tradePriceTypeAtom = atom(
  (get) => get(calculatorStateAtom).priceSource,
  (get, set, tradePriceType: TradePriceType | undefined) => {
    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      priceSource: tradePriceType ?? 'live',
    })
  }
)

export const btcOrSatAtom = atom(
  (get) => get(calculatorStateAtom).btcUnit,
  (get, set, btcUnit: BtcOrSat | SetStateAction<BtcOrSat>) => {
    const state = get(calculatorStateAtom)
    const nextBtcUnit = getValueFromSetStateActionOfAtom(btcUnit)(
      () => state.btcUnit
    )

    set(calculatorStateAtom, {
      ...state,
      btcUnit: nextBtcUnit,
    })
  }
)

export const premiumOrDiscountEnabledAtom = atom(
  (get) => get(calculatorStateAtom).premiumOrDiscountEnabled,
  (get, set, enabled: boolean | SetStateAction<boolean>) => {
    const state = get(calculatorStateAtom)
    const nextEnabled = getValueFromSetStateActionOfAtom(enabled)(
      () => state.premiumOrDiscountEnabled
    )

    set(
      calculatorStateAtom,
      nextEnabled
        ? {...state, premiumOrDiscountEnabled: true}
        : disableFee(state)
    )
  }
)

export const amountInputsSwappedAtom = atom(
  (get) => get(calculatorStateAtom).inputsSwapped,
  (get, set, swapped: boolean | SetStateAction<boolean>) => {
    const state = get(calculatorStateAtom)
    const nextSwapped = getValueFromSetStateActionOfAtom(swapped)(
      () => state.inputsSwapped
    )

    set(calculatorStateAtom, {
      ...state,
      inputsSwapped: nextSwapped,
    })
  }
)

export const btcInputValueAtom = atom(
  (get) => get(calculatorStateAtom).btcInput,
  (get, set, input: string) => {
    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      btcInput: normalizeInputString(input),
    })
  }
)

export const fiatInputValueAtom = atom(
  (get) => get(calculatorStateAtom).fiatInput,
  (get, set, input: string) => {
    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      fiatInput: normalizeInputString(input),
    })
  }
)

export const tradePriceTypeDialogDraftAtom =
  atom<SelectableTradePriceType>('live')

export const fiatValueNumberAtom = atom<number>((get) =>
  parseNormalizedInput(get(calculatorStateAtom).fiatInput)
)

export const btcValueNumberAtom = atom<number>((get) =>
  parseNormalizedInput(get(calculatorStateAtom).btcInput)
)

export const feeAmountAtom = atom(
  (get) => get(calculatorStateAtom).feeAmount,
  (get, set, feeAmount: number | SetStateAction<number>) => {
    const state = get(calculatorStateAtom)
    const nextFeeAmount = getValueFromSetStateActionOfAtom(feeAmount)(
      () => state.feeAmount
    )

    set(calculatorStateAtom, {
      ...state,
      feeAmount: nextFeeAmount,
    })
  }
)

export const ownPriceAtom = atom(
  (get) => get(calculatorStateAtom).manualPriceInput,
  (get, set, input: string | undefined) => {
    set(calculatorStateAtom, {
      ...get(calculatorStateAtom),
      manualPriceInput: input ? normalizeInputString(input) : undefined,
    })
  }
)

export const ownPriceSaveButtonDisabledAtom = atom((get) => !get(ownPriceAtom))

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, newFee: number) => {
    set(calculatorStateAtom, changeFee(get(calculatorStateAtom), newFee))
  }
)

export const premiumOrDiscountSwitchActionAtom = atom(
  (get) => get(premiumOrDiscountEnabledAtom),
  (get, set, nextValue: SetStateAction<boolean>) => {
    const next = getValueFromSetStateActionOfAtom(nextValue)(() =>
      get(premiumOrDiscountEnabledAtom)
    )

    set(premiumOrDiscountEnabledAtom, next)
    set(applyFeeOnFeeChangeActionAtom, 0)
  }
)

export const saveYourPriceActionAtom = atom(
  null,
  (get, set, currency?: CurrencyCode) => {
    const state = get(calculatorStateAtom)
    const fiatCurrency = currency ?? get(btcPriceCurrencyAtom)
    const manualPrice = state.manualPriceInput
    const nextState: CalculatorState = {
      ...state,
      fiatCurrency,
      priceSource: 'your',
      fixedBtcPrice: manualPrice
        ? parseNormalizedInput(manualPrice)
        : undefined,
    }

    set(
      calculatorStateAtom,
      recalculateOppositeSide(nextState, getLiveBtcPrice(get))
    )
  }
)

export const applyFeeOnTradePriceTypeChangeActionAtom = atom(
  null,
  (get, set) => {
    set(
      calculatorStateAtom,
      recalculateOppositeSide(get(calculatorStateAtom), getLiveBtcPrice(get))
    )
  }
)

export const setFormDataBasedOnBtcPriceTypeActionAtom = atom(
  null,
  (get, set, tradePriceType: TradePriceType) => {
    if (tradePriceType === 'frozen') {
      return pipe(
        set(refreshCurrentBtcPriceActionAtom),
        T.map(() => {
          const state = get(calculatorStateAtom)
          const nextState: CalculatorState = {
            ...state,
            priceSource: tradePriceType,
            fixedBtcPrice:
              get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ??
              state.fixedBtcPrice,
          }

          set(
            calculatorStateAtom,
            recalculateOppositeSide(nextState, getLiveBtcPrice(get))
          )
        })
      )()
    }

    set(
      calculatorStateAtom,
      recalculateOppositeSide(
        {
          ...get(calculatorStateAtom),
          priceSource: tradePriceType,
          fixedBtcPrice:
            tradePriceType === 'live'
              ? undefined
              : get(calculatorStateAtom).fixedBtcPrice,
        },
        getLiveBtcPrice(get)
      )
    )
    void set(refreshCurrentBtcPriceActionAtom)()
  }
)

export const showTradePriceTypeDialogActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const tradePriceType = get(tradePriceTypeAtom)
  const initialTradePriceType: SelectableTradePriceType =
    tradePriceType === 'custom'
      ? 'your'
      : tradePriceType === 'frozen' || tradePriceType === 'your'
        ? tradePriceType
        : 'live'

  set(tradePriceTypeDialogDraftAtom, initialTradePriceType)

  return Effect.map(
    set(globalDialogAtom, {
      title: t('tradeCalculator.orderTypes'),
      positiveButtonText: t('common.save'),
      children: React.createElement(TradePriceTypeDialogContent, {
        selectedTradePriceTypeAtom: tradePriceTypeDialogDraftAtom,
      }),
    }),
    (confirmed) => (confirmed ? get(tradePriceTypeDialogDraftAtom) : undefined)
  )
})

export const calculateFiatValueAfterBtcPriceRefreshActionAtom = atom(
  null,
  (get, set) => {
    const state = get(calculatorStateAtom)

    if (state.priceSource !== 'live') return

    set(
      calculatorStateAtom,
      recalculateOppositeSide(state, getLiveBtcPrice(get))
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
    }: {
      automaticCalculationDisabled?: boolean
      btcAmount: string
    }
  ) => {
    const state = get(calculatorStateAtom)

    set(
      calculatorStateAtom,
      automaticCalculationDisabled
        ? {...state, btcInput: normalizeInputString(btcAmount)}
        : changeBtcInput(state, btcAmount, getLiveBtcPrice(get))
    )
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
    const state = get(calculatorStateAtom)

    set(
      calculatorStateAtom,
      automaticCalculationDisabled
        ? {...state, fiatInput: normalizeInputString(fiatAmount)}
        : changeFiatInput(state, fiatAmount, getLiveBtcPrice(get))
    )
  }
)

export const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
  const state = get(calculatorStateAtom)
  const btcPriceCurrency = get(btcPriceCurrencyAtom)

  return pipe(
    set(refreshBtcPriceActionAtom, btcPriceCurrency),
    T.map(() => {
      const latestState = get(calculatorStateAtom)

      if (latestState.priceSource === 'live') {
        set(
          calculatorStateAtom,
          recalculateOppositeSide(latestState, getLiveBtcPrice(get))
        )
      } else if (state.priceSource === 'frozen') {
        set(calculatorStateAtom, latestState)
      }
    })
  )
})

export const switchBtcOrSatValueActionAtom = atom(null, (get, set) => {
  set(
    calculatorStateAtom,
    changeBtcUnit(get(calculatorStateAtom), getLiveBtcPrice(get))
  )
})

export const updateFiatCurrencyActionAtom = atom(
  null,
  (get, set, currency: CurrencyCode) => {
    return pipe(
      set(refreshBtcPriceActionAtom, currency),
      T.map(() => {
        const latestState = get(calculatorStateAtom)
        const nextState: CalculatorState = {
          ...latestState,
          fiatCurrency: currency,
        }

        set(calculatorStateAtom, nextState)
        const stateWithCurrency = get(calculatorStateAtom)
        const stateWithFrozenPrice: CalculatorState = {
          ...stateWithCurrency,
          fixedBtcPrice:
            stateWithCurrency.priceSource === 'frozen'
              ? (get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC ??
                stateWithCurrency.fixedBtcPrice)
              : stateWithCurrency.fixedBtcPrice,
        }

        set(
          calculatorStateAtom,
          recalculateOppositeSide(stateWithFrozenPrice, getLiveBtcPrice(get))
        )
      })
    )()
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
    effectToTaskEither,
    TE.match(
      () => {},
      () => {}
    )
  )()
})

export const calculatorFiatWithoutFeeAtom = atom((get) =>
  Math.round(
    get(calculatorStateAtom).fiatInput
      ? cancelFee(
          parseNormalizedInput(get(calculatorStateAtom).fiatInput),
          get(calculatorStateAtom).feeAmount
        )
      : 0
  )
)

export const calculatedFiatFromCurrentBtcAtom = atom((get) =>
  calculateFiatFromBtc(get(calculatorStateAtom), getLiveBtcPrice(get))
)

export const calculatedBtcFromCurrentFiatAtom = atom((get) =>
  calculateBtcFromFiat(get(calculatorStateAtom), getLiveBtcPrice(get))
)
