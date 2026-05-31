import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {BoltElectric, ChecklistCell} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  originOfferAtom,
  tradeChecklistNetworkDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {networkUpdateToBeSentAtom} from '../../../atoms/updatesToBeSentAtom'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function SetNetworkCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const originOffer = useAtomValue(originOfferAtom)
  const networkUpdateToBeSent = useAtomValue(networkUpdateToBeSentAtom)
  const tradeChecklistNetworkData = useAtomValue(tradeChecklistNetworkDataAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('SET_NETWORK'), [])
  )

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
      icon={BoltElectric}
      disabled={isDisabled}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      subtitle={
        isDisabled
          ? tradeChecklistNetworkData?.received?.btcNetwork
            ? t('tradeChecklist.network.btcNetworkWasSetByReceiver')
            : t('tradeChecklist.network.btcNetworkWillBeSetByReceiver')
          : sideNote
      }
      onPress={onPress}
      headline={t('tradeChecklist.options.SET_NETWORK')}
    />
  )
}

export default SetNetworkCell
