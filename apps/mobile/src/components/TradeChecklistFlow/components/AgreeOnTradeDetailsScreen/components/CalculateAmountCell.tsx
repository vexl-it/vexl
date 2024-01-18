import {useCallback} from 'react'
import {type AmountData} from '@vexl-next/domain/dist/general/tradeChecklist'
import {tradeChecklistDataAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useStore} from 'jotai'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import ChecklistCell from './ChecklistCell'

function CalculateAmountCell(): JSX.Element {
  const store = useStore()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const onPress = useCallback(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)

    const initialDataToSet: AmountData | undefined =
      (tradeChecklistData.amount.received?.timestamp ?? 0) >
      (tradeChecklistData.amount.sent?.timestamp ?? 0)
        ? {
            ...tradeChecklistData.amount.received,
            // on the side of receiver we need to map the type to custom but preserve it on side of creator (for edit trade price purposes)
            tradePriceType:
              tradeChecklistData.amount.received?.tradePriceType === 'your'
                ? 'custom'
                : tradeChecklistData.amount.received?.tradePriceType,
          }
        : tradeChecklistData.amount.sent

    navigation.navigate('CalculateAmount', {
      amountData: {
        btcAmount: initialDataToSet?.btcAmount,
        fiatAmount: initialDataToSet?.fiatAmount,
        tradePriceType: initialDataToSet?.tradePriceType,
        feeAmount: initialDataToSet?.feeAmount,
        btcPrice: initialDataToSet?.btcPrice,
      },
    })
  }, [navigation, store])

  return <ChecklistCell item={'CALCULATE_AMOUNT'} onPress={onPress} />
}

export default CalculateAmountCell
