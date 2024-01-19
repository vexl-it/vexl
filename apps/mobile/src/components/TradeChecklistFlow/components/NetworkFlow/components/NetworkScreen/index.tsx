import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import Content from '../../../Content'
import {Stack} from 'tamagui'
import networkSvg from '../../../../../images/networkSvg'
import SectionTitle from './components/SectionTitle'
import BtcAddress from './components/BtcAddress'
import NetworkInfo from './components/NetworkInfo'
import {
  btcAddressAtom,
  btcNetworkAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
import {useSetAtom} from 'jotai'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import LightningOrOnChain from './components/LightningOrOnChain'
import {useCallback, useEffect} from 'react'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'

type Props = TradeChecklistStackScreenProps<'Network'>

function NetworkScreen({
  route: {
    params: {networkData, navigateBackToChatOnSave},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const setBtcNetwork = useSetAtom(btcNetworkAtom)
  const setBtcAddress = useSetAtom(btcAddressAtom)

  const onFooterButtonPress = useCallback(() => {
    saveLocalNetworkStateToMainState()
    if (navigateBackToChatOnSave) {
      showLoadingOverlay(true)
      void submitTradeChecklistUpdates()().finally(() => {
        showLoadingOverlay(false)
      })
    }
    goBack()
  }, [
    goBack,
    navigateBackToChatOnSave,
    saveLocalNetworkStateToMainState,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
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
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.network.network')}
      />
      <Content scrollable>
        <SectionTitle
          text={t('tradeChecklist.network.network')}
          icon={networkSvg}
          mt="$4"
        />
        <Stack space="$6">
          <LightningOrOnChain />
          <BtcAddress />
        </Stack>
      </Content>
      <NetworkInfo />
      <FooterButtonProxy
        onPress={onFooterButtonPress}
        text={t('common.confirm')}
      />
    </>
  )
}

export default NetworkScreen
