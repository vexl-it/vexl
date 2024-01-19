import {useCallback} from 'react'
import {type AmountData} from '@vexl-next/domain/src/general/tradeChecklist'
import {tradeChecklistAmountDataAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useAtomValue} from 'jotai'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import ChecklistCell from './ChecklistCell'
import {btcAmountUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'

function CalculateAmountCell(): JSX.Element {
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const btcAmountUpdateToBeSent = useAtomValue(btcAmountUpdateToBeSentAtom)
  const tradeChecklistAmountData = useAtomValue(tradeChecklistAmountDataAtom)

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
      sideNote={
        btcAmountUpdateToBeSent
          ? `${btcAmountUpdateToBeSent} BTC`
          : tradeChecklistAmountData.sent?.btcAmount
          ? `${tradeChecklistAmountData.sent.btcAmount} BTC`
          : tradeChecklistAmountData.received?.btcAmount
          ? `${tradeChecklistAmountData.received.btcAmount} BTC`
          : undefined
      }
    />
  )
}

export default CalculateAmountCell
