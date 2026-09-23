import {useNavigation} from '@react-navigation/native'
import {Checklist, EyeShut, type NavigationBarAction} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {type RootStackScreenProps} from '../../../navigationTypes'
import isNoteChatOrigin from '../../../state/chat/utils/isNoteChatOrigin'
import {chatMolecule} from '../atoms'
import useOpenExchangeDetails from './useOpenExchangeDetails'

export default function useChatHeaderRightActions(): NavigationBarAction[] {
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {canExchangeDetailsAtom, chatAtom, chatIdAtom, publicKeyPemBase64Atom} =
    useMolecule(chatMolecule)
  const canExchangeDetails = useAtomValue(canExchangeDetailsAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const openExchangeDetails = useOpenExchangeDetails()

  const exchangeDetailsAction: NavigationBarAction = {
    icon: EyeShut,
    disabled: !canExchangeDetails,
    onPress: openExchangeDetails,
  }

  if (isNoteChatOrigin(chat.origin)) return [exchangeDetailsAction]

  return [
    exchangeDetailsAction,
    {
      icon: Checklist,
      onPress: () => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'AgreeOnTradeDetails',
          chatId,
          inboxKey,
        })
      },
    },
  ]
}
