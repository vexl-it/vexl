import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatHistoryMessageType,
  generateChatMessageId,
  type ChatHistoryMessage,
  type ChatMessage,
  type ChatRecoveryProof,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, Schema, pipe} from 'effect'

export const CHAT_HISTORY_MINIMAL_REQUIRED_VERSION =
  Schema.decodeSync(VersionString)('26.11.2')

export interface ChatMessageWithDirection {
  state: 'received' | 'sent'
  message: ChatMessage
}

// Carries no notification token: the sender is not proven to be a chat
// partner yet. It can still notify us with the token it got before the restore.
export function createRequestHistoryMessage({
  senderPublicKey,
  myVersion,
}: {
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_HISTORY',
    text: '',
    time: now(),
    minimalRequiredVersion: CHAT_HISTORY_MINIMAL_REQUIRED_VERSION,
    myVersion,
    senderPublicKey,
  }
}

const isChatHistoryMessageType = Schema.is(ChatHistoryMessageType)

// Expects reveal photos as data uris, or left out when not to be shared.
function toChatHistoryMessage({
  state,
  message,
}: ChatMessageWithDirection): Option.Option<ChatHistoryMessage> {
  const {messageType} = message
  if (!isChatHistoryMessageType(messageType)) return Option.none()

  const isChatMessage = messageType === 'MESSAGE'
  // Chat images sent before attachments existed only as files on the device
  const imageUnavailable =
    isChatMessage && !!message.image && !message.imageAttachment
  if (
    isChatMessage &&
    !message.text.trim() &&
    !message.imageAttachment &&
    !imageUnavailable
  )
    return Option.none()

  return Option.some({
    uuid: message.uuid,
    author: state === 'sent' ? 'me' : 'them',
    messageType,
    text: message.text,
    time: message.time,
    imageAttachment: message.imageAttachment,
    image: isChatMessage ? undefined : message.image,
    imageUnavailable: imageUnavailable || undefined,
    repliedTo: message.repliedTo,
    tradeChecklistUpdate: message.tradeChecklistUpdate,
    deanonymizedUser: message.deanonymizedUser,
  })
}

export function createHistoryMessage({
  senderPublicKey,
  myVersion,
  messages,
  historyRecoveryProof,
  myVexlToken,
}: {
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
  messages: readonly ChatMessageWithDirection[]
  historyRecoveryProof: ChatRecoveryProof
  myVexlToken?: VexlNotificationToken | undefined
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'HISTORY',
    text: '',
    time: now(),
    minimalRequiredVersion: CHAT_HISTORY_MINIMAL_REQUIRED_VERSION,
    myVersion,
    senderPublicKey,
    history: Array.filterMap(messages, toChatHistoryMessage),
    historyRecoveryProof,
    myVexlToken,
  }
}

/**
 * Rebuilds messages from a received HISTORY. The history sender's messages
 * become received ones and vice versa.
 */
export function chatHistoryToMessages({
  history,
  myPublicKey,
  otherSidePublicKey,
}: {
  history: readonly ChatHistoryMessage[]
  myPublicKey: PublicKeyPemBase64
  otherSidePublicKey: PublicKeyPemBase64
}): ChatMessageWithDirection[] {
  return pipe(
    history,
    Array.map(({author, ...message}): ChatMessageWithDirection => {
      const isFromHistorySender = author === 'me'
      return {
        state: isFromHistorySender ? 'received' : 'sent',
        message: {
          ...message,
          senderPublicKey: isFromHistorySender
            ? otherSidePublicKey
            : myPublicKey,
        },
      }
    })
  )
}
