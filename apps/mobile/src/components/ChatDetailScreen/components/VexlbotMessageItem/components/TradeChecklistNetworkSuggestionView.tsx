import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

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
    <VexlbotBubble text={t('vexlbot.agreeOnPreferredNetwork')}>
      <Button
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'Network',
            chatId,
            inboxKey,
            params: {networkData: undefined},
          })
        }}
        size="medium"
        variant="secondary"
        text={t('tradeChecklist.options.SET_NETWORK')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistNetworkSuggestionView
