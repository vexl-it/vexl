import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {useCallback} from 'react'
import {type RootStackParamsList} from '../../navigationTypes'

export function chatDetailRouteParams(
  chat: Chat
): RootStackParamsList['ChatDetail'] {
  return {
    otherSideKey: chat.otherSide.publicKey,
    inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
  }
}

export function useNavigateToChatDetail(chat: Chat | undefined): () => void {
  const navigation = useNavigation()

  return useCallback(() => {
    if (!chat) return
    navigation.navigate('ChatDetail', chatDetailRouteParams(chat))
  }, [chat, navigation])
}
