import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type AmountData,
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
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
import {
  applyFeeOnBtcAmount,
  cancelFeeOnBtcAmount,
  formatBtcPrice,
} from '../../../../state/tradeChecklist/utils/amount'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import {removeTrailingZerosFromNumberString} from '../../../../utils/removeTrailingZerosFromNumberString'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import updatesToBeSentAtom, {
  addAmountActionAtom,
} from '../../atoms/updatesToBeSentAtom'

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
    const btcOrSat = get(btcOrSatAtom)
    const btcInputValue = Number(get(btcInputValueAtom))
    const previousAppliedFee = get(feeAmountAtom)

    if (get(btcInputValueAtom)) {
      const btcValueWithoutPreviousFee = cancelFeeOnBtcAmount(
        btcInputValue,
        previousAppliedFee
      )
      const btcValueWithNewFeeApplied = applyFeeOnBtcAmount(
        btcValueWithoutPreviousFee,
        newFee
      )

      set(
        btcInputValueAtom,
        btcOrSat === 'SAT'
          ? String(Math.round(btcValueWithNewFeeApplied))
          : removeTrailingZerosFromNumberString(
              btcValueWithNewFeeApplied.toFixed(DECIMALS_FOR_BTC_VALUE)
            )
      )
    }
    set(feeAmountAtom, newFee)
  }
)

export const applyFeeOnTradePriceTypeChangeActionAtom = atom(
  null,
  (get, set) => {
    const btcInputValue = Number(get(btcInputValueAtom))
    const feeAmount = get(feeAmountAtom)

    if (get(btcInputValueAtom)) {
      set(
        btcInputValueAtom,
        removeTrailingZerosFromNumberString(
          applyFeeOnBtcAmount(btcInputValue, feeAmount).toFixed(
            DECIMALS_FOR_BTC_VALUE
          )
        )
      )
    }
  }
)

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

export const offerTypeAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
})

export const setFormDataBasedOnBtcPriceTypeActionAtom = atom(
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
      })
    )
  }
)

export const calculateBtcValueAfterBtcPriceRefreshActionAtom = atom(
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
      const btcAmount = Number(fiatAmount) / tradeBtcPrice

      set(
        btcInputValueAtom,
        btcOrSat === 'BTC'
          ? formatBtcPrice(applyFeeOnBtcAmount(btcAmount, feeAmount))
          : `${Math.round(
              applyFeeOnBtcAmount(btcAmount, feeAmount) * SATOSHIS_IN_BTC
            )}`
      )
    } else {
      set(btcInputValueAtom, '')
    }
  }
)

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

export const switchBtcOrSatValueActionAtom = atom(
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

export const updateFiatCurrencyActionAtom = atom(
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
        set(feeAmountAtom, initialDataToSet?.feeAmount ?? 0)
        set(tradePriceTypeAtom, initialDataToSet?.tradePriceType ?? 'live')
        set(
          selectedCurrencyCodeAtom,
          initialDataToSet?.currency ?? tradeOrOriginOfferCurrency
        )
        set(tradeBtcPriceAtom, (prev) =>
          initialDataToSet?.tradePriceType !== 'live'
            ? initialDataToSet?.btcPrice ?? prev
            : get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
        )
        set(fiatInputValueAtom, String(initialDataToSet?.fiatAmount ?? ''))
        set(calculateBtcValueOnFiatAmountChangeActionAtom, {
          fiatAmount: String(initialDataToSet?.fiatAmount ?? 0),
        })

        set(
          premiumOrDiscountEnabledAtom,
          initialDataToSet?.feeAmount !== 0 ?? false
        )
      })
    )()
  }
)

export const saveLocalCalculatedAmountDataStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)
    const tradePriceType = get(tradePriceTypeAtom)
    const btcAmount = Number(get(btcInputValueAtom))
    const fiatAmount = Number(get(fiatInputValueAtom))
    const feeAmount = get(feeAmountAtom)
    const btcPrice = get(tradeBtcPriceAtom)
    const currency = get(selectedCurrencyCodeAtom)

    const btcAmountWithoutFee = Number(
      formatBtcPrice(cancelFeeOnBtcAmount(btcAmount, feeAmount))
    )

    if (currency && fiatAmount > currencies[currency].maxAmount) {
      return pipe(
        TE.Do,
        TE.chainW(() =>
          set(askAreYouSureActionAtom, {
            steps: [
              {
                type: 'StepWithText',
                title: t(
                  'tradeChecklist.calculateAmount.exceededTransactionLimit'
                ),
                description: t(
                  'tradeChecklist.calculateAmount.transactionLimitForSelectedCurrency',
                  {amount: currencies[currency].maxAmount, currency}
                ),
                positiveButtonText: t('common.close'),
              },
            ],
            variant: 'info',
          })
        ),
        TE.match(
          () => {
            return false
          },
          () => {
            return false
          }
        )
      )
    } else {
      set(addAmountActionAtom, {
        tradePriceType: tradePriceType === 'custom' ? 'your' : tradePriceType,
        btcAmount: btcAmountWithoutFee,
        fiatAmount,
        feeAmount,
        btcPrice,
        currency,
      })

      return T.of(true)
    }
  }
)
