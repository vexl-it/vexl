import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {Base64String} from '../utility/Base64String.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {UriString} from '../utility/UriString.brand'
import {generateUuid} from '../utility/Uuid.brand'
import {VersionString} from '../utility/VersionString.brand'
import {DeanonymizedUser} from './DeanonymizedUser'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'
import {UserName} from './UserName.brand'
import {RevealedRealLifeInfo} from './UserNameAndAvatar.brand'
import {ClubUuid} from './clubs'
import {NoteId, OneNoteInState} from './notes'
import {
  isVexlNotificationToken,
  VexlNotificationToken,
} from './notifications/VexlNotificationToken'
import {FriendLevel, GoldenAvatarType, OfferId, OneOfferInState} from './offers'
import {TradeChecklistUpdate} from './tradeChecklist'

export const ServerVisibleMessageType = Schema.Literal(
  'MESSAGE',
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'CANCEL_REQUEST_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
  'OFFER_DELETED',
  'INBOX_DELETED',
  'APPROVE_CONTACT_REVEAL',
  'DISAPPROVE_CONTACT_REVEAL',
  'REQUEST_CONTACT_REVEAL',
  'TRADE_CHECKLIST_UPDATE',
  'VERSION_UPDATE',
  'FCM_CYPHER_UPDATE',
  'MESSAGE_READ',
  'REACTION',
  // Local-only nudge to clean up an inactive chat. MUST NEVER be sent to the
  // server or the other side.
  'INACTIVITY_REMINDER'
)
export type ServerVisibleMessageType = typeof ServerVisibleMessageType.Type

export const MessageType = Schema.Literal(
  ...ServerVisibleMessageType.literals,
  // Chat restore must stay invisible to the server, so these travel as
  // 'MESSAGE' and only the encrypted payload carries the real type.
  'REQUEST_HISTORY',
  'HISTORY'
)
export type MessageType = typeof MessageType.Type

const isServerVisibleMessageType = Schema.is(ServerVisibleMessageType)

export function toServerVisibleMessageType(
  messageType: MessageType
): ServerVisibleMessageType {
  return isServerVisibleMessageType(messageType) ? messageType : 'MESSAGE'
}

export const ChatUserIdentity = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  clubsIds: Schema.optional(Schema.Array(ClubUuid)),
  realLifeInfo: Schema.optional(RevealedRealLifeInfo),
})
export type ChatUserIdentity = typeof ChatUserIdentity.Type

export const ChatMessageId = Schema.UUID.pipe(Schema.brand('ChatMessageId'))
export type ChatMessageId = typeof ChatMessageId.Type

// Derived from the sender's master seed for one chat, see
// `deriveChatRecoveryProof`. Sent only into open chats, so after a backup
// restore it tells a real chat partner apart from anyone who knows the key.
export const ChatRecoveryProof = Base64String.pipe(
  Schema.brand('ChatRecoveryProof')
)
export type ChatRecoveryProof = typeof ChatRecoveryProof.Type

export const ChatImageId = Schema.UUID.pipe(Schema.brand('ChatImageId'))
export type ChatImageId = typeof ChatImageId.Type

/**
 * Pointer to an encrypted image stored on chat-service. `key` is a single-use
 * AES-256-GCM key, so only chat participants can decrypt the stored blob.
 */
export const ChatImageAttachment = Schema.Struct({
  id: ChatImageId,
  key: Base64String,
  width: Schema.Int.pipe(Schema.positive()),
  height: Schema.Int.pipe(Schema.positive()),
})
export type ChatImageAttachment = typeof ChatImageAttachment.Type

export const RepliedToData = Schema.Struct({
  text: Schema.String,
  messageAuthor: Schema.Literal('me', 'them'),
  imageAttachment: Schema.optional(ChatImageAttachment),
})
export type RepliedToData = typeof RepliedToData.Type

export const ReactionEmoji = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(32),
  Schema.brand('ReactionEmoji')
)
export type ReactionEmoji = typeof ReactionEmoji.Type

/**
 * Carries the resulting reaction state (not a toggle), so a redelivered
 * message can't undo itself. Missing `emoji` removes the reaction.
 */
export const MessageReaction = Schema.Struct({
  targetMessageId: ChatMessageId,
  emoji: Schema.optional(ReactionEmoji),
})
export type MessageReaction = typeof MessageReaction.Type

export const ChatHistoryMessageType = MessageType.pipe(
  Schema.pickLiteral(
    'MESSAGE',
    'REQUEST_REVEAL',
    'APPROVE_REVEAL',
    'DISAPPROVE_REVEAL',
    'REQUEST_MESSAGING',
    'APPROVE_MESSAGING',
    'DISAPPROVE_MESSAGING',
    'CANCEL_REQUEST_MESSAGING',
    'APPROVE_CONTACT_REVEAL',
    'DISAPPROVE_CONTACT_REVEAL',
    'REQUEST_CONTACT_REVEAL',
    'TRADE_CHECKLIST_UPDATE'
  )
)
export type ChatHistoryMessageType = typeof ChatHistoryMessageType.Type

/**
 * One message of a chat as stored by the sender of a HISTORY message. Chat
 * images travel as their original attachments, revealed identity photos as
 * base64 data uris. `author` is relative to the HISTORY sender.
 */
export const ChatHistoryMessage = Schema.Struct({
  uuid: ChatMessageId,
  author: Schema.Literal('me', 'them'),
  messageType: ChatHistoryMessageType,
  text: Schema.String,
  time: UnixMilliseconds,
  imageAttachment: Schema.optional(ChatImageAttachment),
  // Photo of a reveal sent before the trade checklist
  image: Schema.optional(UriString),
  imageUnavailable: Schema.optional(Schema.Boolean),
  repliedTo: Schema.optional(RepliedToData),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdate),
  deanonymizedUser: Schema.optional(DeanonymizedUser),
})
export type ChatHistoryMessage = typeof ChatHistoryMessage.Type

export const ChatMessagePayload = Schema.Struct({
  uuid: ChatMessageId,
  text: Schema.optional(Schema.String),
  imageAttachment: Schema.optional(ChatImageAttachment),
  repliedTo: Schema.optional(RepliedToData),
  time: UnixMilliseconds,
  messageType: MessageType,
  lastReceivedVersion: Schema.optional(VersionString),
  myVersion: Schema.optional(VersionString),
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdate),
  reaction: Schema.optional(MessageReaction),
  minimalRequiredVersion: Schema.optional(VersionString),
  deanonymizedUser: Schema.optional(
    Schema.Struct({
      name: UserName,
      imageBase64: Schema.optional(Base64String),
      partialPhoneNumber: Schema.optional(Schema.String),
      fullPhoneNumber: Schema.optional(E164PhoneNumber),
    })
  ),
  // Wire key kept from the cypher era; it carries the vexl notification token.
  myFcmCypher: Schema.optional(VexlNotificationToken),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuid)),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  verifiedCommonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
  history: Schema.optional(Schema.Array(ChatHistoryMessage)),
  recoveryProof: Schema.optional(ChatRecoveryProof),
  historyRecoveryProof: Schema.optional(ChatRecoveryProof),
})
export type ChatMessagePayload = typeof ChatMessagePayload.Type

export function generateChatMessageId(): ChatMessageId {
  return Schema.decodeSync(ChatMessageId)(generateUuid())
}

export const ChatMessage = Schema.Struct({
  uuid: ChatMessageId,
  text: Schema.String,
  minimalRequiredVersion: Schema.optional(VersionString),
  time: UnixMilliseconds,
  myVersion: Schema.optional(VersionString),
  goldenAvatarType: Schema.optional(GoldenAvatarType),

  /**
   * Used only for messages  of type `VERSION_UPDATE`
   */
  lastReceivedVersion: Schema.optional(VersionString),
  forceShow: Schema.optional(Schema.Boolean),

  /**
   * Local-only image uri. Holds the revealed identity photo, a picked chat
   * image until it is uploaded as `imageAttachment`, or a chat image received
   * before images moved to `imageAttachment`.
   */
  image: Schema.optional(UriString),
  imageAttachment: Schema.optional(ChatImageAttachment),
  // Local-only. A restored chat image that exists only on the other device.
  imageUnavailable: Schema.optional(Schema.Boolean),
  repliedTo: Schema.optional(RepliedToData),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdate),
  reaction: Schema.optional(MessageReaction),
  deanonymizedUser: Schema.optional(DeanonymizedUser),
  senderPublicKey: PublicKeyPemBase64,
  messageType: MessageType,
  myVexlToken: Schema.optional(VexlNotificationToken),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuid)),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  verifiedCommonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
  // Used only for messages of type `HISTORY`
  history: Schema.optional(Schema.Array(ChatHistoryMessage)),
  // The sender's proof for this chat
  recoveryProof: Schema.optional(ChatRecoveryProof),
  // Used only for messages of type `HISTORY`: the receiver's proof, showing
  // the history comes from someone the receiver chatted with
  historyRecoveryProof: Schema.optional(ChatRecoveryProof),
})
export type ChatMessage = typeof ChatMessage.Type

export const Inbox = Schema.Struct({
  privateKey: PrivateKeyHolder,
  // if the user is author of the offer
  offerId: Schema.optional(OfferId),
  // If the user has requested the offer
  requestOfferId: Schema.optional(OfferId),
  // if the user is author of the note
  noteId: Schema.optional(NoteId),
  // If the user has responded to the note
  requestNoteId: Schema.optional(NoteId),
})
export type Inbox = typeof Inbox.Type

export const ChatOrigin = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('myOffer'),
    offerId: OfferId,
    offer: Schema.optional(OneOfferInState),
  }),
  Schema.Struct({
    type: Schema.Literal('theirOffer'),
    offerId: OfferId,
    offer: Schema.optional(OneOfferInState),
  }),
  Schema.Struct({
    type: Schema.Literal('myNote'),
    noteId: NoteId,
    note: Schema.optional(OneNoteInState),
  }),
  Schema.Struct({
    type: Schema.Literal('theirNote'),
    noteId: NoteId,
    note: Schema.optional(OneNoteInState),
  }),
  Schema.Struct({type: Schema.Literal('unknown')})
)
export type ChatOrigin = typeof ChatOrigin.Type

export const ChatId = Schema.String.pipe(Schema.brand('ChatId'))
export type ChatId = typeof ChatId.Type

export function generateChatId(): ChatId {
  return Schema.decodeSync(ChatId)(generateUuid())
}

export const CalendarEventId = Schema.String.pipe(
  Schema.brand('CalendarEventId')
)
export type CalendarEventId = typeof CalendarEventId.Type

const chatFields = {
  id: ChatId,
  inbox: Inbox,
  origin: ChatOrigin,
  otherSide: ChatUserIdentity,
  isUnread: Schema.optionalWith(Schema.Boolean, {default: () => true}),
  lastMessageReadByOtherSideAt: Schema.optionalWith(UnixMilliseconds, {
    nullable: true,
  }),
  showInfoBar: Schema.optionalWith(Schema.Boolean, {default: () => true}),
  showVexlbotNotifications: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showVexlbotInitialMessage: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  tradeChecklistCalendarEventId: Schema.optional(CalendarEventId),
  otherSideVersion: Schema.optional(VersionString),
  lastReportedVersion: Schema.optional(VersionString),
  otherSideVexlToken: Schema.optional(VexlNotificationToken),
  lastReportedVexlToken: Schema.optional(VexlNotificationToken),
  lastReadByOtherSide: Schema.optional(UnixMilliseconds),
  // Time of the last real message for which an INACTIVITY_REMINDER was already
  // inserted - ensures the reminder is inserted at most once per episode.
  inactivityReminderInsertedForMessageTime: Schema.optional(UnixMilliseconds),
}

export const Chat = Schema.transform(
  Schema.Struct({
    ...chatFields,
    // Apps <= 26.9.5 stored the other side's token only here, see https://github.com/vexl-it/vexl/issues/2124
    otherSideFcmCypher: Schema.optional(Schema.Unknown),
  }),
  Schema.typeSchema(Schema.Struct(chatFields)),
  {
    strict: true,
    decode: ({otherSideFcmCypher, ...chat}) => ({
      ...chat,
      otherSideVexlToken:
        chat.otherSideVexlToken ??
        (isVexlNotificationToken(otherSideFcmCypher)
          ? otherSideFcmCypher
          : undefined),
    }),
    encode: (chat) => chat,
  }
)
export type Chat = typeof Chat.Type

export const MessageCypher = Schema.String.pipe(Schema.brand('MessageCypher'))
export type MessageCypher = typeof MessageCypher.Type

export const ServerMessage = Schema.Struct({
  message: MessageCypher,
  senderPublicKey: PublicKeyPemBase64,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
})
export type ServerMessage = typeof ServerMessage.Type

export const ChatMessageRequiringNewerVersion = Schema.Struct({
  uuid: ChatMessageId,
  messageType: Schema.Literal('REQUIRES_NEWER_VERSION'),
  serverMessage: ServerMessage,
  myVersion: Schema.optionalWith(VersionString, {nullable: true}),
  minimalRequiredVersion: VersionString,
  time: UnixMilliseconds,
  senderPublicKey: PublicKeyPemBase64,
  messageParsed: Schema.optional(Schema.Unknown),
  text: Schema.Literal('-'),
  deanonymizedUser: Schema.optional(Schema.Undefined),
  image: Schema.optional(Schema.Undefined),
  imageAttachment: Schema.optional(Schema.Undefined),
  imageUnavailable: Schema.optional(Schema.Undefined),
  myVexlToken: Schema.optional(VexlNotificationToken),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  verifiedCommonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
})
export type ChatMessageRequiringNewerVersion =
  typeof ChatMessageRequiringNewerVersion.Type

export const TYPING_INDICATION_TIMEOUT_MS = 5_000 // 5 seconds

export class TypingMessage extends Schema.TaggedClass<TypingMessage>(
  'TypingMessage'
)('TypingMessage', {
  typing: Schema.Boolean,
  myPublicKey: PublicKeyPemBase64,
}) {}

export const StreamOnlyChatMessagePayload = Schema.Union(TypingMessage)
export type StreamOnlyChatMessagePayload =
  typeof StreamOnlyChatMessagePayload.Type

export const StreamOnlyMessageCypher = Schema.String.pipe(
  Schema.brand('StreamOnlyMessageCypher')
)
export type StreamOnlyMessageCypher = typeof StreamOnlyMessageCypher.Type
