import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, type Atom} from 'jotai'
import {tradeOrOriginOfferCurrencyAtom} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {
  tradeCalculatorInitialState,
  type TradeCalculatorState,
} from '../../../TradeCalculator/atoms'
import updatesToBeSentAtom, {
  addAmountActionAtom,
} from '../../atoms/updatesToBeSentAtom'

// export const offerTypeAtom = atom((get) => {
//   const offerForTradeChecklist = get(fromChatAtoms.originOfferAtom)
//   return offerForTradeChecklist?.offerInfo?.publicPart?.offerType
// })

export const isOtherSideAmountDataNewerThanMineAtom = atom(false)

export const saveButtonDisabledAtom = atom(false)

// export const isOtherSideAmountDataNewerThanMineAtom = atom((get) => {
//   const tradeChecklistAmountData = get(tradeChecklistAmountDataAtom)
//   const otherSideTimestampIsGreater =
//     (tradeChecklistAmountData.received?.timestamp ?? 0) >
//     (tradeChecklistAmountData.sent?.timestamp ?? 0)
//   const tradePriceTypeDiffers =
//     get(tradePriceTypeAtom) !==
//     tradeChecklistAmountData.received?.tradePriceType
//   const btcAmountDiffers =
//     get(btcInputValueAtom) !==
//     tradeChecklistAmountData.received?.btcAmount?.toString()
//   const fiatAmountDiffers =
//     get(fiatInputValueAtom) !==
//     tradeChecklistAmountData.received?.fiatAmount?.toString()
//   const feeDiffers =
//     get(feeAmountAtom) !== tradeChecklistAmountData.received?.feeAmount

//   return (
//     otherSideTimestampIsGreater &&
//     !get(updatesToBeSentAtom).amount &&
//     !tradePriceTypeDiffers &&
//     !btcAmountDiffers &&
//     !fiatAmountDiffers &&
//     !feeDiffers
//   )
// })

// export const syncDataWithChatStateActionAtom = atom(
//   null,
//   (get, set, data: AmountData | undefined) => {
//     const tradeOrOriginOfferCurrency = get(tradeOrOriginOfferCurrencyAtom)
//     const updatesToBeSent = get(updatesToBeSentAtom)
//     const initialDataToSet = updatesToBeSent.amount ?? data

//     return pipe(
//       set(refreshCurrentBtcPriceActionAtom),
//       T.map(() => {
//         set(tradePriceTypeAtom, initialDataToSet?.tradePriceType ?? 'live')
//         set(
//           selectedCurrencyCodeAtom,
//           initialDataToSet?.currency ?? tradeOrOriginOfferCurrency
//         )
//         set(
//           tradeBtcPriceAtom,
//           (prev) => get(btcPriceForOfferWithStateAtom)?.btcPrice ?? prev
//         )
//         set(btcInputValueAtom, String(initialDataToSet?.btcAmount ?? ''))
//         set(calculateFiatValueOnBtcAmountChangeActionAtom, {
//           btcAmount: String(initialDataToSet?.btcAmount ?? 0),
//         })

//         set(
//           premiumOrDiscountEnabledAtom,
//           initialDataToSet?.feeAmount !== 0 ?? false
//         )
//         set(feeAmountAtom, initialDataToSet?.feeAmount ?? 0)
//       })
//     )()
//   }
// )

export const tradeCalculatorStateAtom = atom(tradeCalculatorInitialState)

export const setTradeCalculatorStateActionAtom = atom(
  null,
  (get, set, amountData?: AmountData | undefined) => {
    const updatesToBeSent = get(updatesToBeSentAtom)
    const tradeOriginOfferCurrency = get(tradeOrOriginOfferCurrencyAtom)

    return {
      tradePriceType:
        updatesToBeSent.amount?.tradePriceType ??
        amountData?.tradePriceType ??
        'live',
      selectedCurrencyCode:
        updatesToBeSent.amount?.currency ??
        amountData?.currency ??
        tradeOriginOfferCurrency,
      btcInputValue: String(
        updatesToBeSent.amount?.btcAmount ?? amountData?.btcAmount ?? ''
      ),
      feeAmount:
        updatesToBeSent.amount?.feeAmount ?? amountData?.feeAmount ?? 0,
    }
  }
)

export const saveLocalCalculatedAmountDataStateToMainStateActionAtom = atom(
  null,
  (get, set, tradeCalculatorStateAtom: Atom<TradeCalculatorState>) => {
    const {t} = get(translationAtom)
    const tradeCalculatorState = get(tradeCalculatorStateAtom)

    const {
      tradePriceType,
      selectedCurrencyCode: currency,
      btcInputValue: btcAmount,
      feeAmount,
      fiatInputValue: fiatAmount,
      tradeBtcPrice: btcPrice,
    } = tradeCalculatorState

    if (currency && Number(fiatAmount) > currencies[currency].maxAmount) {
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
        btcAmount: Number(btcAmount),
        fiatAmount: Number(fiatAmount),
        feeAmount,
        btcPrice,
        currency,
      })

      return T.of(true)
    }
  }
)
