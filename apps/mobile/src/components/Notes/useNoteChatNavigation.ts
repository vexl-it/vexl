import {useNavigation} from '@react-navigation/native'
import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {useAtomValue} from 'jotai'
import {useCallback, useMemo} from 'react'
import chatWithMessagesForNoteAtom from '../../state/chat/atoms/chatWithMessagesForNoteAtom'
import {getChatState} from '../../state/chat/utils/offerStates'

/**
 * Looks up the chat opened from the given note (if any) and exposes whether
 * it is open plus a callback navigating to it.
 */
export function useNoteChatNavigation(noteId: NoteId): {
  readonly isChatOpen: boolean
  readonly navigateToChat: () => void
} {
  const navigation = useNavigation()
  const chat = useAtomValue(
    useMemo(() => chatWithMessagesForNoteAtom(noteId), [noteId])
  )
  const isChatOpen = getChatState(chat) === 'chatOpen'

  const navigateToChat = useCallback(() => {
    if (!chat) return

    navigation.navigate('ChatDetail', {
      otherSideKey: chat.chat.otherSide.publicKey,
      inboxKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
    })
  }, [chat, navigation])

  return {isChatOpen, navigateToChat}
}
