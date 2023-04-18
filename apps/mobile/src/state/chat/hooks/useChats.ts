import {useAtomValue} from 'jotai'
import {
  blockedChatsAtom,
  chatsListAtom,
  chatsToDisplayAtom,
  orderedChatsAtom,
  receivedChatRequests,
  sentChatRequests,
} from '../atom'
import {type ChatWithMessages} from '../domain'

export default function useChats(): ChatWithMessages[] {
  return useAtomValue(chatsListAtom)
}

export function useOrderedChats(): ChatWithMessages[] {
  return useAtomValue(orderedChatsAtom)
}

// Chat to display:
// -- Must be accepted
// -- Have at least one message (deleted chats are not shown here)
// -- Must not be blocked
export function useChatsToDisplayInList(): ChatWithMessages[] {
  return useAtomValue(chatsToDisplayAtom)
}

export function useBlockedChats(): ChatWithMessages[] {
  return useAtomValue(blockedChatsAtom)
}

export function useReceivedChatRequests(): ChatWithMessages[] {
  return useAtomValue(receivedChatRequests)
}

export function useSentChatRequests(): ChatWithMessages[] {
  return useAtomValue(sentChatRequests)
}
