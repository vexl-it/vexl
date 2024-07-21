import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {SATOSHIS_IN_BTC} from '../../../../state/currentBtcPriceAtoms'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  tradeChecklistAmountDataAtom,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  applyFeeOnNumberValue,
  cancelFeeOnNumberValue,
  formatBtcPrice,
} from '../../../../state/tradeChecklist/utils/amount'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {
  btcInputValueAtom,
  btcOrSatAtom,
  btcPriceForOfferWithStateAtom,
  calculateFiatValueAfterBtcPriceRefreshActionAtom,
  feeAmountAtom,
  fiatInputValueAtom,
  premiumOrDiscountEnabledAtom,
  refreshCurrentBtcPriceActionAtom,
  selectedCurrencyCodeAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
} from '../../../TradeCalculator/atoms'
import updatesToBeSentAtom, {
  addAmountActionAtom,
} from '../../atoms/updatesToBeSentAtom'

export const applyFeeOnFeeChangeActionAtom = atom(
  null,
  (get, set, newFee: number) => {
    const fiatInutValue = Number(get(fiatInputValueAtom))
    const previousAppliedFee = get(feeAmountAtom)

    if (get(fiatInputValueAtom)) {
      const fiatValueWithoutPreviousFee = cancelFeeOnNumberValue(
        fiatInutValue,
        previousAppliedFee
      )
      const fiatValueWithNewFeeApplied = applyFeeOnNumberValue(
        fiatValueWithoutPreviousFee,
        newFee
      )

      set(fiatInputValueAtom, String(Math.round(fiatValueWithNewFeeApplied)))
    }
    set(feeAmountAtom, newFee)
  }
)

export const offerTypeAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
})

export const isMineOfferAtom = atom((get) => {
  const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
  return !!offerForTradeChecklist?.ownershipInfo
})

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
        set(btcInputValueAtom, String(initialDataToSet?.btcAmount ?? ''))

        set(calculateFiatValueAfterBtcPriceRefreshActionAtom)

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
    const btcOrSat = get(btcOrSatAtom)
    const tradePriceType = get(tradePriceTypeAtom)
    const btcInputValue = Number(get(btcInputValueAtom))
    const btcAmount =
      btcOrSat === 'SAT'
        ? Number(formatBtcPrice(btcInputValue / SATOSHIS_IN_BTC))
        : btcInputValue
    const fiatAmount = Number(get(fiatInputValueAtom))
    const feeAmount = get(feeAmountAtom)
    const btcPrice = get(tradeBtcPriceAtom)
    const currency = get(selectedCurrencyCodeAtom)

    const fiatAmountWithoutFee = Math.round(
      cancelFeeOnNumberValue(fiatAmount, feeAmount)
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
