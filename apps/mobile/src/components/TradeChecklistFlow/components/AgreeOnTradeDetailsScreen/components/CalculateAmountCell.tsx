import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  otherSideDataAtom,
  tradeChecklistAmountDataAtom,
  tradeOrOriginOfferCurrencyAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {amountUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'
import ChecklistCell from './ChecklistCell'

function CalculateAmountCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const otherSideData = useAtomValue(otherSideDataAtom)
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
      return t(
        'tradeChecklist.optionsDetail.CALCULATE_AMOUNT.themAddedAmount',
        {
          them: otherSideData.userName,
          btcAmount: tradeChecklistAmountData.received.btcAmount,
          fiatAmount: tradeChecklistAmountData.received.fiatAmount,
          currency: tradeOrOriginOfferCurrency,
        }
      )
    }
    return undefined
  }, [
    amountUpdateToBeSent,
    itemStatus,
    tradeOrOriginOfferCurrency,
    otherSideData.userName,
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
  }, [
    navigation,
    tradeChecklistAmountData.received,
    tradeChecklistAmountData.sent,
  ])

  return (
    <ChecklistCell
      item="CALCULATE_AMOUNT"
      onPress={onPress}
      subtitle={subtitle}
      sideNote={sideNote}
    />
  )
}

export default CalculateAmountCell
