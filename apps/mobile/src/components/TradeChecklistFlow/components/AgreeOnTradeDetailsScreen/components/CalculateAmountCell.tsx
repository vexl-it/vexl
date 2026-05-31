import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import {ChecklistCell, MoneyBankNotes} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  tradeChecklistAmountDataAtom,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {getLatestAmountDataMessage} from '../../../../../state/tradeChecklist/utils/amount'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  formatDecimal,
  formatInteger,
} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {amountUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function getFractionDigits(number: number): number {
  return number.toString().split('.')[1]?.length ?? 0
}

function CalculateAmountCell(): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const amountUpdateToBeSent = useAtomValue(amountUpdateToBeSentAtom)
  const tradeChecklistAmountData = useAtomValue(tradeChecklistAmountDataAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('CALCULATE_AMOUNT'), [])
  )

  const subtitle = useMemo(() => {
    if (
      !amountUpdateToBeSent &&
      tradeChecklistAmountData.received &&
      tradeChecklistAmountData.received.timestamp >
        (tradeChecklistAmountData.sent?.timestamp ?? 0) &&
      itemStatus !== 'accepted'
    ) {
      const receivedAmount = tradeChecklistAmountData.received
      const btcAmount = receivedAmount.btcAmount ?? 0
      const fiatAmount = receivedAmount.fiatAmount ?? 0

      return t(
        'tradeChecklist.optionsDetail.CALCULATE_AMOUNT.themAddedAmount',
        {
          them: t('common.otherSide'),
          btcAmount: formatDecimal(btcAmount, locale, {
            minimumFractionDigits: getFractionDigits(btcAmount),
          }),
          fiatAmount: formatInteger(fiatAmount, locale),
          currency: tradeOrOriginOfferCurrency,
        }
      )
    }
    return undefined
  }, [
    amountUpdateToBeSent,
    itemStatus,
    locale,
    tradeOrOriginOfferCurrency,
    t,
    tradeChecklistAmountData.received,
    tradeChecklistAmountData.sent?.timestamp,
  ])

  const sideNote = useMemo(() => {
    if (subtitle) return undefined

    let btcAmount, feeAmount

    if (amountUpdateToBeSent?.btcAmount) {
      btcAmount = amountUpdateToBeSent.btcAmount
      feeAmount = amountUpdateToBeSent.feeAmount
    } else if (tradeChecklistAmountData.sent?.btcAmount) {
      btcAmount = tradeChecklistAmountData.sent.btcAmount
      feeAmount = tradeChecklistAmountData.sent.feeAmount
    } else if (tradeChecklistAmountData.received?.btcAmount) {
      btcAmount = tradeChecklistAmountData.received.btcAmount
      feeAmount = tradeChecklistAmountData.received.feeAmount
    } else {
      return undefined
    }

    return (
      `${btcAmount} BTC` +
      (feeAmount !== 0
        ? ` (${t(
            'tradeChecklist.calculateAmount.includingAbbreviation'
          )} ${feeAmount}% ${t('tradeChecklist.calculateAmount.fee')})`
        : ``)
    )
  }, [
    amountUpdateToBeSent?.btcAmount,
    amountUpdateToBeSent?.feeAmount,
    subtitle,
    t,
    tradeChecklistAmountData.received?.btcAmount,
    tradeChecklistAmountData.received?.feeAmount,
    tradeChecklistAmountData.sent?.btcAmount,
    tradeChecklistAmountData.sent?.feeAmount,
  ])

  const onPress = useCallback(() => {
    if (amountUpdateToBeSent) {
      navigation.navigate('CalculateAmount', {
        amountData: amountUpdateToBeSent,
      })
      return
    }

    const latestAmountDataMessage = getLatestAmountDataMessage(
      tradeChecklistAmountData
    )

    if (
      latestAmountDataMessage?.by === 'them' &&
      latestAmountDataMessage.status === 'pending'
    ) {
      navigation.navigate('ConfirmAmount', {
        amountData: latestAmountDataMessage.amountData,
      })
      return
    }

    const initialDataToSet: AmountData | undefined =
      (tradeChecklistAmountData.received?.timestamp ?? 0) >
      (tradeChecklistAmountData.sent?.timestamp ?? 0)
        ? {
            ...tradeChecklistAmountData.received,
            // on the side of receiver we need to map the type to custom but preserve it on side of creator (for edit trade price purposes)
            tradePriceType:
              tradeChecklistAmountData.received?.tradePriceType === 'your'
                ? 'custom'
                : tradeChecklistAmountData.received?.tradePriceType,
          }
        : tradeChecklistAmountData.sent

    navigation.navigate('CalculateAmount', {
      amountData: {
        btcAmount: initialDataToSet?.btcAmount,
        fiatAmount: initialDataToSet?.fiatAmount,
        tradePriceType: initialDataToSet?.tradePriceType,
        feeAmount: initialDataToSet?.feeAmount,
        btcPrice: initialDataToSet?.btcPrice,
      },
    })
  }, [amountUpdateToBeSent, navigation, tradeChecklistAmountData])

  return (
    <ChecklistCell
      icon={MoneyBankNotes}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      onPress={onPress}
      subtitle={subtitle ?? sideNote}
      headline={t('tradeChecklist.options.CALCULATE_AMOUNT')}
    />
  )
}

export default CalculateAmountCell
