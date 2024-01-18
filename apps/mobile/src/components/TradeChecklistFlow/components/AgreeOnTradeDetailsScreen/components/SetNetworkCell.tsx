import {useAtomValue, useStore} from 'jotai'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {useCallback} from 'react'
import {
  originOfferAtom,
  tradeChecklistDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import ChecklistCell from './ChecklistCell'

function SetNetworkCell(): JSX.Element {
  const store = useStore()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const originOffer = useAtomValue(originOfferAtom)

  const onPress = useCallback(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)

    navigation.navigate('Network', {
      networkData: {
        btcNetwork: tradeChecklistData.network.sent?.btcNetwork,
        btcAddress: tradeChecklistData.network.sent?.btcAddress,
      },
    })
  }, [navigation, store])

  return (
    <ChecklistCell
      hidden={
        (!!originOffer?.ownershipInfo &&
          originOffer?.offerInfo.publicPart.offerType === 'SELL') ||
        (!originOffer?.ownershipInfo &&
          originOffer?.offerInfo.publicPart.offerType === 'BUY')
      }
      item={'SET_NETWORK'}
      onPress={onPress}
    />
  )
}

export default SetNetworkCell
