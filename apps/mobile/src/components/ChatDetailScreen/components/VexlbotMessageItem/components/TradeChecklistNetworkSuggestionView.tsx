import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistNetworkSuggestionView(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    tradeChecklistNetworkAtom,
    shouldHideNetworkCellForTradeChecklistAtom,
  } = useMolecule(chatMolecule)
  const shouldHideNetworkCellForTradeChecklist = useAtomValue(
    shouldHideNetworkCellForTradeChecklistAtom
  )
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const agreedOnNetwork = network.networkSettled(networkData)

  if (agreedOnNetwork || shouldHideNetworkCellForTradeChecklist) return null

  return (
    <VexlbotActionCard
      buttonText={t('tradeChecklist.options.SET_NETWORK')}
      description={t('vexlbot.agreeOnPreferredNetwork')}
      onPress={() => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'Network',
          chatId,
          inboxKey,
          params: {networkData: undefined},
        })
      }}
      title={t('tradeChecklist.options.SET_NETWORK')}
    />
  )
}

export default TradeChecklistNetworkSuggestionView
