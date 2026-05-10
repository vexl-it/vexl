import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {btcPriceDataAtom} from '../../../../state/currentBtcPriceAtoms'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  tradeChecklistAmountDataAtom,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {computeMaxAmountForCurrency} from '../../../../utils/localization/currency'
import {globalDialogAtom} from '../../../GlobalDialog'
import {
  btcPriceForOfferWithStateAtom,
  calculatorStateAtom,
  refreshCurrentBtcPriceActionAtom,
  selectedCurrencyCodeAtom,
  tradePriceTypeAtom,
} from '../../../TradeCalculator/atoms'
import {
  cancelFee,
  formatSavedBtcAmountFromBtcUnit,
  parseNormalizedInput,
  recalculateOppositeSide,
  resolveEffectiveBtcPrice,
  type CalculatorState,
} from '../../../TradeCalculator/helpers'
import updatesToBeSentAtom, {
  addAmountActionAtom,
} from '../../atoms/updatesToBeSentAtom'

export {applyFeeOnFeeChangeActionAtom} from '../../../TradeCalculator/atoms'

export const offerTypeAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
})

export const isMineOfferAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return !!offerForTradeChecklist?.ownershipInfo
})

export const saveButtonDisabledAtom = atom((get) => {
  const {btcInput, fiatInput} = get(calculatorStateAtom)

  return !btcInput || !fiatInput
})

export const isOtherSideAmountDataNewerThanMineAtom = atom((get) => {
  const tradeChecklistAmountData = get(tradeChecklistAmountDataAtom)
  const calculatorState = get(calculatorStateAtom)
  const fiatAmountWithoutFee = Math.round(
    cancelFee(
      parseNormalizedInput(calculatorState.fiatInput),
      calculatorState.feeAmount
    )
  )
  const otherSideTimestampIsGreater =
    (tradeChecklistAmountData.received?.timestamp ?? 0) >
    (tradeChecklistAmountData.sent?.timestamp ?? 0)
  const tradePriceTypeForPayload =
    get(tradePriceTypeAtom) === 'custom' ? 'your' : get(tradePriceTypeAtom)
  const tradePriceTypeDiffers =
    tradePriceTypeForPayload !==
    tradeChecklistAmountData.received?.tradePriceType
  const btcAmountDiffers =
    formatSavedBtcAmountFromBtcUnit(
      calculatorState.btcInput,
      calculatorState.btcUnit
    ) !== tradeChecklistAmountData.received?.btcAmount
  const fiatAmountDiffers =
    fiatAmountWithoutFee !== tradeChecklistAmountData.received?.fiatAmount
  const feeDiffers =
    calculatorState.feeAmount !== tradeChecklistAmountData.received?.feeAmount

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
        const tradePriceType = initialDataToSet?.tradePriceType ?? 'live'
        const hydratedState: CalculatorState = {
          ...get(calculatorStateAtom),
          feeAmount: initialDataToSet?.feeAmount ?? 0,
          priceSource: tradePriceType,
          fiatCurrency:
            initialDataToSet?.currency ?? tradeOrOriginOfferCurrency,
          fixedBtcPrice:
            tradePriceType === 'live'
              ? undefined
              : (initialDataToSet?.btcPrice ??
                get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC),
          btcInput: String(initialDataToSet?.btcAmount ?? ''),
          fiatInput: '',
          btcUnit: 'BTC',
          premiumOrDiscountEnabled: initialDataToSet?.feeAmount !== 0,
          lastEditedSide: 'btc',
        }

        set(selectedCurrencyCodeAtom, hydratedState.fiatCurrency)
        set(
          calculatorStateAtom,
          recalculateOppositeSide(
            hydratedState,
            get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC
          )
        )
      })
    )()
  }
)

export const saveLocalCalculatedAmountDataStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)
    const calculatorState = get(calculatorStateAtom)
    const tradePriceType = calculatorState.priceSource
    const btcAmount = formatSavedBtcAmountFromBtcUnit(
      calculatorState.btcInput,
      calculatorState.btcUnit
    )
    const fiatAmount = parseNormalizedInput(calculatorState.fiatInput)
    const feeAmount = calculatorState.feeAmount
    const btcPrice =
      resolveEffectiveBtcPrice(
        calculatorState,
        get(btcPriceForOfferWithStateAtom)?.btcPrice?.BTC
      ).price ?? 0
    const currency = get(selectedCurrencyCodeAtom)

    const fiatAmountWithoutFee = Math.round(cancelFee(fiatAmount, feeAmount))

    const btcPriceData = get(btcPriceDataAtom)
    const maxAmount = computeMaxAmountForCurrency({
      btcPriceInCurrency: currency
        ? btcPriceData[currency]?.btcPrice?.BTC
        : undefined,
      btcPriceInEur: btcPriceData.EUR?.btcPrice?.BTC,
    })
    if (currency && fiatAmount > maxAmount) {
      return pipe(
        set(globalDialogAtom, {
          title: t('tradeChecklist.calculateAmount.exceededTransactionLimit'),
          subtitle: t(
            'tradeChecklist.calculateAmount.transactionLimitForSelectedCurrency',
            {amount: maxAmount, currency}
          ),
          positiveButtonText: t('common.close'),
        }).pipe(effectToTaskEither),
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
        btcAmount,
        fiatAmount: fiatAmountWithoutFee,
        feeAmount,
        btcPrice,
        currency,
      })

      return T.of(true)
    }
  }
)
