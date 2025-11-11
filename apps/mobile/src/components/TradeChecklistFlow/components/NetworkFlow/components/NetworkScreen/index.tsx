import {Effect} from 'effect/index'
import {useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import networkSvg from '../../../../../images/networkSvg'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import Content from '../../../Content'
import {
  btcAddressAtom,
  btcNetworkAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
import BtcAddress from './components/BtcAddress'
import LightningOrOnChain from './components/LightningOrOnChain'
import NetworkInfo from './components/NetworkInfo'
import SectionTitle from './components/SectionTitle'

type Props = TradeChecklistStackScreenProps<'Network'>

function NetworkScreen({
  navigation,
  route: {
    params: {networkData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const setBtcNetwork = useSetAtom(btcNetworkAtom)
  const setBtcAddress = useSetAtom(btcAddressAtom)
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()

  const onFooterButtonPress = useCallback(() => {
    saveLocalNetworkStateToMainState()
    if (shouldNavigateBackToChatOnSave) {
      showLoadingOverlay(true)
      void Effect.runPromise(submitTradeChecklistUpdates())
        .then((success) => {
          if (!success) return
          navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
        })
        .finally(() => {
          showLoadingOverlay(false)
        })
    } else {
      navigation.navigate('AgreeOnTradeDetails')
    }
  }, [
    saveLocalNetworkStateToMainState,
    shouldNavigateBackToChatOnSave,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
    navigation,
    store,
  ])

  useEffect(() => {
    setBtcNetwork(networkData?.btcNetwork ?? 'LIGHTING')
    setBtcAddress(networkData?.btcAddress)
  }, [
    networkData?.btcAddress,
    networkData?.btcNetwork,
    setBtcAddress,
    setBtcNetwork,
  ])

  return (
    <>
      <HeaderProxy title={t('tradeChecklist.network.network')} />
      <Content scrollable>
        <SectionTitle
          text={t('tradeChecklist.network.network')}
          icon={networkSvg}
          mt="$4"
        />
        <Stack gap="$6">
          <LightningOrOnChain />
          <BtcAddress />
        </Stack>
      </Content>
      <NetworkInfo />
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        onPress={onFooterButtonPress}
        text={t('common.confirm')}
      />
    </>
  )
}

export default NetworkScreen
