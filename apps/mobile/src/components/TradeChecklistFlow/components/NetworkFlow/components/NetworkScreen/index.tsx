import {useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {YStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {useTradeChecklistExitNavigation} from '../../../../useTradeChecklistExitNavigation'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  btcNetworkAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
import LightningOrOnChain from './components/LightningOrOnChain'
import NetworkInfo from './components/NetworkInfo'

type Props = TradeChecklistStackScreenProps<'Network'>

function NetworkScreen({
  route: {
    params: {networkData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const setBtcNetwork = useSetAtom(btcNetworkAtom)

  const onFooterButtonPress = useCallback(() => {
    saveLocalNetworkStateToMainState()
    tradeChecklistExitNavigation()
  }, [saveLocalNetworkStateToMainState, tradeChecklistExitNavigation])

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
