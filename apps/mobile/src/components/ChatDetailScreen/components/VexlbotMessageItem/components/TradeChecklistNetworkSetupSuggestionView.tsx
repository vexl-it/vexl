import VexlbotBubble from './VexlbotBubble'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {chatMolecule} from '../../../atoms'
import {useAtomValue} from 'jotai'
import * as network from '../../../../../state/tradeChecklist/utils/network'

function TradeChecklistNetworkSetupSuggestionView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {chatIdAtom, publicKeyPemBase64Atom, tradeChecklistNetworkAtom} =
    useMolecule(chatMolecule)
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const networkDataToDisplay = network.getNetworkData(networkData)

  if (networkDataToDisplay?.networkData.btcNetwork) return null

  return (
    <VexlbotBubble text={t('vexlbot.agreeOnPreferredNetwork')}>
      <Button
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'Network',
            chatId,
            inboxKey,
            params: {networkData: undefined, navigateBackToChatOnSave: true},
          })
        }}
        size={'medium'}
        variant={'secondary'}
        text={t('tradeChecklist.options.SET_NETWORK')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistNetworkSetupSuggestionView
