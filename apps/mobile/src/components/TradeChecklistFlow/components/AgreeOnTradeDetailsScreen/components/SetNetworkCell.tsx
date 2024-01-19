import {useAtomValue} from 'jotai'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {useCallback} from 'react'
import {
  originOfferAtom,
  tradeChecklistNetworkDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import ChecklistCell from './ChecklistCell'
import {networkUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function SetNetworkCell(): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const originOffer = useAtomValue(originOfferAtom)
  const networkUpdateToBeSent = useAtomValue(networkUpdateToBeSentAtom)
  const tradeChecklistNetworkData = useAtomValue(tradeChecklistNetworkDataAtom)

  const sideNote =
    networkUpdateToBeSent === 'LIGHTING' ||
    tradeChecklistNetworkData.received?.btcNetwork === 'LIGHTING'
      ? t('tradeChecklist.network.lightning')
      : networkUpdateToBeSent === 'ON_CHAIN' ||
        tradeChecklistNetworkData.received?.btcNetwork === 'ON_CHAIN'
      ? t('tradeChecklist.network.onChain')
      : undefined

  const onPress = useCallback(() => {
    navigation.navigate('Network', {
      networkData: {
        btcNetwork: tradeChecklistNetworkData.sent?.btcNetwork,
        btcAddress: tradeChecklistNetworkData.sent?.btcAddress,
      },
    })
  }, [
    navigation,
    tradeChecklistNetworkData.sent?.btcAddress,
    tradeChecklistNetworkData.sent?.btcNetwork,
  ])

  return (
    <ChecklistCell
      hidden={
        (!!originOffer?.ownershipInfo &&
          originOffer?.offerInfo.publicPart.offerType === 'SELL') ||
        (!originOffer?.ownershipInfo &&
          originOffer?.offerInfo.publicPart.offerType === 'BUY')
      }
      item="SET_NETWORK"
      onPress={onPress}
      sideNote={sideNote}
    />
  )
}

export default SetNetworkCell
