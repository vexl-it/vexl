import {Effect} from 'effect/index'
import {useSetAtom, useStore} from 'jotai'
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
  btcNetworkAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
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
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const setBtcNetwork = useSetAtom(btcNetworkAtom)
  const shouldNavigateBackToChatOnSave =
    !useWasOpenFromAgreeOnTradeDetailsScreen()

  const onFooterButtonPress = useCallback(() => {
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
    saveLocalNetworkStateToMainState,
    shouldNavigateBackToChatOnSave,
    showLoadingOverlay,
    submitTradeChecklistUpdates,
    navigation,
    store,
  ])

  useEffect(() => {
    setBtcNetwork(networkData?.btcNetwork ?? 'LIGHTING')
  }, [networkData?.btcNetwork, setBtcNetwork])

  return (
    <TradeChecklistItemPageLayout
      scrollable
      header={{
        title: t('tradeChecklist.network.network'),
      }}
      bottomButton={{
        disabled: false,
        onPress: onFooterButtonPress,
        text: t('common.save'),
        variant: 'primary',
      }}
    >
      <YStack flex={1} gap="$6" pt="$4">
        <LightningOrOnChain />
        <NetworkInfo />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default NetworkScreen
