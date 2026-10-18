import {type ChatRecoveryProof} from '@vexl-next/domain/src/general/messaging'
import {Array} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import addMessagesToChats from './addMessagesToChats'
import {isChatRecoveryPending} from './chatRecovery'
import settlePendingRecoveryChats from './settlePendingRecoveryChats'

function isFromChat(
  message: ChatMessageWithState
): (chat: ChatWithMessages) => boolean {
  return (chat) =>
    chat.chat.otherSide.publicKey === message.message.senderPublicKey
}

/**
 * Adds already filtered messages to the chats of the inbox. Messages of
 * pending recovery chats are held there and left out of `visibleMessages`.
 */
export default function addIncomingMessagesToInbox({
  inbox,
  messages,
  createNewChats,
  expectedRecoveryProof,
}: {
  inbox: InboxInState
  messages: readonly ChatMessageWithState[]
  createNewChats: (messages: ChatMessageWithState[]) => ChatWithMessages[]
  expectedRecoveryProof: (
    chat: ChatWithMessages
  ) => ChatRecoveryProof | undefined
}): {updatedInbox: InboxInState; visibleMessages: ChatMessageWithState[]} {
  const pendingRecoveryChats = inbox.pendingRecoveryChats ?? []
  const [notInExistingChat, inExistingChat] = Array.partition(messages, (one) =>
    Array.some(inbox.chats, isFromChat(one))
  )
  const [inNewChat, inPendingChat] = Array.partition(notInExistingChat, (one) =>
    Array.some(pendingRecoveryChats, isFromChat(one))
  )

  const [newChats, newPendingChats] = Array.partition(
    createNewChats(inNewChat),
    isChatRecoveryPending
  )
  const {pending, recovered} = settlePendingRecoveryChats({
    chats: pendingRecoveryChats,
    incoming: inPendingChat,
    expectedRecoveryProof,
  })
  const chats = [
    ...newChats,
    ...recovered,
    ...addMessagesToChats(inbox.chats)(inExistingChat),
  ]

  return {
    updatedInbox: {
      ...inbox,
      chats,
      pendingRecoveryChats: [...newPendingChats, ...pending],
    },
    visibleMessages: Array.filter(messages, (one) =>
      Array.some(chats, isFromChat(one))
    ),
  }
}
