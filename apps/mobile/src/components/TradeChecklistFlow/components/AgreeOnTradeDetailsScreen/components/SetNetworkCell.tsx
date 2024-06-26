import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  originOfferAtom,
  tradeChecklistNetworkDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {networkUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'
import ChecklistCell from './ChecklistCell'

function SetNetworkCell(): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const originOffer = useAtomValue(originOfferAtom)
  const networkUpdateToBeSent = useAtomValue(networkUpdateToBeSentAtom)
  const tradeChecklistNetworkData = useAtomValue(tradeChecklistNetworkDataAtom)

  const btcNetworkInState = (
    tradeChecklistNetworkData?.received ?? tradeChecklistNetworkData?.sent
  )?.btcNetwork

  const sideNote =
    networkUpdateToBeSent === 'LIGHTING' || btcNetworkInState === 'LIGHTING'
      ? t('tradeChecklist.network.lightning')
      : networkUpdateToBeSent === 'ON_CHAIN' || btcNetworkInState === 'ON_CHAIN'
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

  const isDisabled =
    (!!originOffer?.ownershipInfo &&
      originOffer?.offerInfo.publicPart.offerType === 'SELL') ||
    (!originOffer?.ownershipInfo &&
      originOffer?.offerInfo.publicPart.offerType === 'BUY')

  return (
    <ChecklistCell
      isDisabled={isDisabled}
      subtitle={
        isDisabled
          ? tradeChecklistNetworkData?.received?.btcNetwork
            ? t('tradeChecklist.network.btcNetworkWasSetByReceiver')
            : t('tradeChecklist.network.btcNetworkWillBeSetByReceiver')
          : undefined
      }
      item="SET_NETWORK"
      onPress={onPress}
      sideNote={sideNote}
    />
  )
}

export default SetNetworkCell
