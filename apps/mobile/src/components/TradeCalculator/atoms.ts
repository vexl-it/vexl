import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
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
  convertFiatValueToNumber,
} from './utils'

export const currencySelectVisibleAtom = atom<boolean>(false)
export const tradeBtcPriceAtom = atom<number>(0)
export const tradePriceTypeAtom = atom<TradePriceType | undefined>(undefined)
export const btcOrSatAtom = atom<BtcOrSat>('BTC')
export const selectedCurrencyCodeAtom = atom<CurrencyCode | undefined>(
  undefined
)
export const selectedCurrencyCodeForOwnPriceAtom = atom<
  CurrencyCode | undefined
>(undefined)
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

export const btcPriceForSelectedOwnCurrencyWithStateAtom =
  createBtcPriceForCurrencyAtom(selectedCurrencyCodeForOwnPriceAtom)

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, newFee: number) => {
    const fiatInputValue = convertFiatValueToNumber(get(fiatInputValueAtom))
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

  set(tradePriceTypeAtom, 'your')

  if (ownPrice) {
    set(tradeBtcPriceAtom, Number(ownPrice))
  }
  set(calculateFiatValueOnBtcAmountChangeActionAtom, {
    btcAmount: get(btcInputValueAtom),
  })
})

export const applyFeeOnTradePriceTypeChangeActionAtom = atom(
  null,
  (get, set) => {
    const fiatInputValue = convertFiatValueToNumber(get(fiatInputValueAtom))
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
    set(tradePriceTypeAtom, tradePriceType)

    void set(refreshCurrentBtcPriceActionAtom)()
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
    const tradePriceType = get(tradePriceTypeAtom)
    const selectedCurrencyCodeForOwnPrice = get(
      selectedCurrencyCodeForOwnPriceAtom
    )
    const selectedCurrencyCode = get(selectedCurrencyCodeAtom)
    const btcPriceForOfferWithState = get(btcPriceForOfferWithStateAtom)
    const btcPriceForSelectedOwnCurrencyWithState = get(
      btcPriceForSelectedOwnCurrencyWithStateAtom
    )

    set(btcInputValueAtom, btcAmount)

    if (automaticCalculationDisabled) {
      return
    }

    if (!btcAmount) {
      set(fiatInputValueAtom, '')
      return
    }

    if (tradeBtcPrice) {
      if (
        tradePriceType === 'your' &&
        selectedCurrencyCodeForOwnPrice !== selectedCurrencyCode &&
        btcPriceForSelectedOwnCurrencyWithState?.btcPrice &&
        btcPriceForOfferWithState?.btcPrice
      ) {
        const numberValue =
          btcOrSat === 'BTC'
            ? Number(btcAmount)
            : Number(btcAmount) / SATOSHIS_IN_BTC

        const fiatAmountForOwnPriceCurrency = numberValue * tradeBtcPrice
        const btcAmountForOwnPriceCurrencyCode =
          fiatAmountForOwnPriceCurrency / btcPriceForOfferWithState.btcPrice.BTC

        set(
          fiatInputValueAtom,
          String(
            Math.round(
              applyFeeOnNumberValue(
                btcAmountForOwnPriceCurrencyCode *
                  btcPriceForSelectedOwnCurrencyWithState.btcPrice.BTC,
                feeAmount
              )
            )
          )
        )
      } else {
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
      }
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
    const tradePriceType = get(tradePriceTypeAtom)
    const selectedCurrencyCodeForOwnPrice = get(
      selectedCurrencyCodeForOwnPriceAtom
    )
    const selectedCurrencyCode = get(selectedCurrencyCodeAtom)
    const btcPriceForOfferWithState = get(btcPriceForOfferWithStateAtom)
    const btcPriceForSelectedOwnCurrencyWithState = get(
      btcPriceForSelectedOwnCurrencyWithStateAtom
    )

    set(fiatInputValueAtom, fiatAmount)

    if (automaticCalculationDisabled) {
      return
    }

    if (!fiatAmount) {
      set(btcInputValueAtom, '')
      return
    }

    if (tradeBtcPrice) {
      if (
        tradePriceType === 'your' &&
        selectedCurrencyCodeForOwnPrice !== selectedCurrencyCode &&
        btcPriceForSelectedOwnCurrencyWithState?.btcPrice &&
        btcPriceForOfferWithState?.btcPrice
      ) {
        const adjustedFiatAmount = cancelFeeOnNumberValue(
          Number(fiatAmount),
          feeAmount
        )
        const btcAmountForSelectedCurrencyCode =
          adjustedFiatAmount /
          btcPriceForSelectedOwnCurrencyWithState.btcPrice.BTC
        const fiatAmountForOwnPriceCurrency =
          btcAmountForSelectedCurrencyCode *
          btcPriceForOfferWithState.btcPrice.BTC
        const btcAmount = fiatAmountForOwnPriceCurrency / tradeBtcPrice

        set(
          btcInputValueAtom,
          btcOrSat === 'BTC'
            ? formatBtcPrice(btcAmount)
            : `${Math.round(btcAmount * SATOSHIS_IN_BTC)}`
        )
      } else {
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
      }
    } else {
      set(btcInputValueAtom, '')
    }
  }
)

export const refreshCurrentBtcPriceActionAtom = atom(null, (get, set) => {
  const tradePriceType = get(tradePriceTypeAtom)
  const btcPriceCurrency = get(btcPriceCurrencyAtom)
  const btcInputValue = get(btcInputValueAtom)

  return pipe(
    set(refreshBtcPriceActionAtom, btcPriceCurrency),
    T.map(() => {
      if (tradePriceType !== 'your')
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
    const tradePriceType = get(tradePriceTypeAtom)

    if (tradePriceType === 'your') {
      void pipe(
        set(refreshBtcPriceActionAtom, currency),
        T.map(() => {
          set(selectedCurrencyCodeForOwnPriceAtom, currency)
          void set(refreshCurrentBtcPriceActionAtom)()
        })
      )()
    } else {
      set(selectedCurrencyCodeAtom, currency)
      void set(refreshCurrentBtcPriceActionAtom)()
    }
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
