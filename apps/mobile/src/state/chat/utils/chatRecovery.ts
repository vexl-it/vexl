import {
  chatHistoryToMessages,
  type ChatMessageWithDirection,
} from '@vexl-next/resources-utils/src/chat/utils/chatHistory'
import {Array, Option, pipe} from 'effect'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import {isMetadataMessageType} from './isMetadataMessage'

const messageTypesNotStartingRecovery: ReadonlyArray<
  ChatMessageWithState['message']['messageType']
> = [
  // A new request is handled as usual
  'REQUEST_MESSAGING',
  // The chat is over
  'CANCEL_REQUEST_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
  'INBOX_DELETED',
]

/**
 * Whether a message from a sender we have no chat with, received on an inbox
 * restored from a backup, recovers that chat. Metadata messages don't, as the
 * chat would have nothing to show until its history arrives.
 */
export function startsChatRecovery(message: ChatMessageWithState): boolean {
  return (
    (message.state === 'received' ||
      message.state === 'receivedButRequiresNewerVersion') &&
    !isMetadataMessageType(message.message.messageType) &&
    !Array.contains(
      messageTypesNotStartingRecovery,
      message.message.messageType
    )
  )
}

export function chatsWaitingForHistoryRequest(
  inbox: InboxInState
): ChatWithMessages[] {
  return Array.filter(
    inbox.chats,
    (chat) => !!chat.restoredFromBackup && !chat.historyRequested
  )
}

/**
 * Chats whose other side asked for their history. Requests from senders we
 * have no chat with are ignored.
 */
export function chatsToAnswerWithHistory({
  inbox,
  newMessages,
}: {
  inbox: InboxInState
  newMessages: readonly ChatMessageWithState[]
}): ChatWithMessages[] {
  return pipe(
    newMessages,
    Array.filter(
      (one) =>
        one.state === 'received' &&
        one.message.messageType === 'REQUEST_HISTORY'
    ),
    Array.dedupeWith(
      (a, b) => a.message.senderPublicKey === b.message.senderPublicKey
    ),
    Array.filterMap((request) =>
      Array.findFirst(
        inbox.chats,
        (chat) =>
          chat.chat.otherSide.publicKey === request.message.senderPublicKey
      )
    )
  )
}

export function messagesToShareAsHistory(
  chat: ChatWithMessages
): ChatMessageWithDirection[] {
  return Array.filterMap(chat.messages, (one) =>
    one.state === 'received' || one.state === 'sent'
      ? Option.some({state: one.state, message: one.message})
      : Option.none()
  )
}

/**
 * Messages rebuilt from HISTORY messages in `incoming`. Only restored chats
 * accept history, and messages we already have win over their restored copy.
 */
export function restoredMessagesFromHistory({
  chat,
  incoming,
}: {
  chat: ChatWithMessages
  incoming: readonly ChatMessageWithState[]
}): ChatMessageWithState[] {
  if (!chat.restoredFromBackup) return []

  const knownIds = new Set(
    Array.map([...chat.messages, ...incoming], (one) => one.message.uuid)
  )

  return pipe(
    incoming,
    Array.filterMap((one) =>
      one.state === 'received' && one.message.messageType === 'HISTORY'
        ? Option.some(one.message.history ?? [])
        : Option.none()
    ),
    Array.flatMap((history) =>
      chatHistoryToMessages({
        history,
        myPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
        otherSidePublicKey: chat.chat.otherSide.publicKey,
      })
    ),
    Array.dedupeWith((a, b) => a.message.uuid === b.message.uuid),
    Array.filter((one) => !knownIds.has(one.message.uuid)),
    Array.map(
      ({state, message}): ChatMessageWithState =>
        state === 'sent'
          ? {state: 'sent', message, restored: true}
          : {state: 'received', message, restored: true}
    )
  )
}
