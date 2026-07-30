import {useNavigation} from '@react-navigation/native'
import {Checklist, EyeShut, type NavigationBarAction} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {type RootStackScreenProps} from '../../../navigationTypes'
import isNoteChatOrigin from '../../../state/chat/utils/isNoteChatOrigin'
import {chatMolecule} from '../atoms'
import useOpenRevealIdentityFlow from './useOpenRevealIdentityFlow'

export default function useChatHeaderRightAction(): NavigationBarAction {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    canSendMessagesAtom,
    chatAtom,
    chatIdAtom,
    identityRevealStatusAtom,
    publicKeyPemBase64Atom,
  } = useMolecule(chatMolecule)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const openRevealIdentityFlow = useOpenRevealIdentityFlow()

  if (!isNoteChatOrigin(chat.origin)) {
    return {
      icon: Checklist,
      onPress: () => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'AgreeOnTradeDetails',
          chatId,
          inboxKey,
        })
      },
    }
  }

  return {
    icon: EyeShut,
    disabled:
      !canSendMessages ||
      (identityRevealStatus !== 'notStarted' &&
        identityRevealStatus !== 'theyAsked'),
    onPress: openRevealIdentityFlow,
  }
}
