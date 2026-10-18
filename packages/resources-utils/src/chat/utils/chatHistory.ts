import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatHistoryMessageType,
  generateChatMessageId,
  type ChatHistoryMessage,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Option, Schema, Struct, pipe} from 'effect'

export const CHAT_HISTORY_MINIMAL_REQUIRED_VERSION =
  Schema.decodeSync(VersionString)('26.10.0')

export interface ChatMessageWithDirection {
  state: 'received' | 'sent'
  message: ChatMessage
}

export function createRequestHistoryMessage({
  senderPublicKey,
  myVersion,
  myVexlToken,
}: {
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
  myVexlToken?: VexlNotificationToken | undefined
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_HISTORY',
    text: '',
    time: now(),
    minimalRequiredVersion: CHAT_HISTORY_MINIMAL_REQUIRED_VERSION,
    myVersion,
    senderPublicKey,
    // Like FCM_CYPHER_UPDATE: only `myFcmCypher` goes over the wire
    myFcmCypher: myVexlToken,
    myVexlToken,
  }
}

const isChatHistoryMessageType = Schema.is(ChatHistoryMessageType)

function withoutImages(
  update: TradeChecklistUpdate | undefined
): TradeChecklistUpdate | undefined {
  if (!update?.identity) return update
  return {...update, identity: Struct.omit(update.identity, 'image')}
}

function toChatHistoryMessage({
  state,
  message,
}: ChatMessageWithDirection): Option.Option<ChatHistoryMessage> {
  const {messageType} = message
  if (!isChatHistoryMessageType(messageType)) return Option.none()
  if (messageType === 'MESSAGE' && !message.text.trim()) return Option.none()

  return Option.some({
    uuid: message.uuid,
    author: state === 'sent' ? 'me' : 'them',
    messageType,
    text: message.text,
    time: message.time,
    repliedTo: message.repliedTo && Struct.omit(message.repliedTo, 'image'),
    tradeChecklistUpdate: withoutImages(message.tradeChecklistUpdate),
    deanonymizedUser: message.deanonymizedUser,
    goldenAvatarType: message.goldenAvatarType,
    senderClubsUuids: message.senderClubsUuids,
    commonFriends: message.commonFriends,
    verifiedCommonFriends: message.verifiedCommonFriends,
    friendLevel: message.friendLevel,
  })
}

export function createHistoryMessage({
  senderPublicKey,
  myVersion,
  messages,
}: {
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
  messages: readonly ChatMessageWithDirection[]
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
