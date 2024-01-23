import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistNetworkSuggestionView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    offerForChatAtom,
    publicKeyPemBase64Atom,
    tradeChecklistNetworkAtom,
  } = useMolecule(chatMolecule)
  const offerForChat = useAtomValue(offerForChatAtom)
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const agreedOnNetwork = network.networkSettled(networkData)

  if (
    agreedOnNetwork ||
    (!!offerForChat?.ownershipInfo &&
      offerForChat?.offerInfo.publicPart.offerType === 'SELL') ||
    (!offerForChat?.ownershipInfo &&
      offerForChat?.offerInfo.publicPart.offerType === 'BUY')
  )
    return null

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
        size="medium"
        variant="secondary"
        text={t('tradeChecklist.options.SET_NETWORK')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistNetworkSuggestionView
