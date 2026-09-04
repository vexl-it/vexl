import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import chatWithMessagesForNoteAtom from '../../state/chat/atoms/chatWithMessagesForNoteAtom'
import {getChatState} from '../../state/chat/utils/offerStates'
import {useNavigateToChatDetail} from '../../utils/chat/goToChatDetail'

/**
 * Looks up the chat opened from the given note (if any) and exposes whether
 * it is open plus a callback navigating to it.
 */
export function useNoteChatNavigation(noteId: NoteId): {
  readonly isChatOpen: boolean
  readonly navigateToChat: () => void
} {
  const chat = useAtomValue(
    useMemo(() => chatWithMessagesForNoteAtom(noteId), [noteId])
  )
  const isChatOpen = getChatState(chat) === 'chatOpen'

  const navigateToChat = useNavigateToChatDetail(chat?.chat)

  return {isChatOpen, navigateToChat}
}
