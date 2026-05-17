import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {YStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {submitTradeChecklistUpdatesActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  btcAddressAtom,
  btcAddressTempAtom,
  btcNetworkAtom,
  displayParsingErrorAtom,
  saveBtcAddressActionAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
import BtcAddress from './components/BtcAddress'
import LightningOrOnChain from './components/LightningOrOnChain'
import NetworkInfo from './components/NetworkInfo'

type Props = TradeChecklistStackScreenProps<'Network'>

function NetworkScreen({
  navigation,
  route: {
    params: {networkData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const btcAddressTemp = useAtomValue(btcAddressTempAtom)
  const btcNetwork = useAtomValue(btcNetworkAtom)
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const saveBtcAddress = useSetAtom(saveBtcAddressActionAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const setBtcNetwork = useSetAtom(btcNetworkAtom)
  const setBtcAddress = useSetAtom(btcAddressAtom)
  const setBtcAddressTemp = useSetAtom(btcAddressTempAtom)
  const setDisplayParsingError = useSetAtom(displayParsingErrorAtom)
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()

  const onFooterButtonPress = useCallback(() => {
    const isBtcAddressSaved = saveBtcAddress(
      btcNetwork === 'ON_CHAIN' ? btcAddressTemp : ''
    )

    if (!isBtcAddressSaved) return

    saveLocalNetworkStateToMainState()
    if (shouldNavigateBackToChatOnSave) {
      showLoadingOverlay(true)
      void Effect.runPromise(submitTradeChecklistUpdates())
        .then((success) => {
          if (!success) return
          navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
        })
        .finally(() => {
          showLoadingOverlay(false)
        })
    } else {
      navigation.popTo('AgreeOnTradeDetails')
    }
  }, [
    btcAddressTemp,
    btcNetwork,
    saveBtcAddress,
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
    setBtcAddressTemp(networkData?.btcAddress ?? '')
    setDisplayParsingError(false)
  }, [
    networkData?.btcAddress,
    networkData?.btcNetwork,
    setBtcAddress,
    setBtcAddressTemp,
    setBtcNetwork,
    setDisplayParsingError,
  ])

  return (
    <TradeChecklistItemPageLayout
      scrollable
      header={{
        title: t('tradeChecklist.network.network'),
      }}
      footer={<NetworkInfo />}
      bottomButton={{
        disabled: false,
        onPress: onFooterButtonPress,
        text: t('common.save'),
        variant: 'primary',
      }}
    >
      <YStack flex={1} gap="$6" pt="$4">
        <LightningOrOnChain />
        <BtcAddress />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default NetworkScreen
