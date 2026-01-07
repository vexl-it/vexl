import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {Base64String} from '../utility/Base64String.brand'
import {ExpoNotificationToken} from '../utility/ExpoNotificationToken.brand'
import {SemverString} from '../utility/SmeverString.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {UriString} from '../utility/UriString.brand'
import {generateUuid} from '../utility/Uuid.brand'
import {DeanonymizedUser} from './DeanonymizedUser'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'
import {UserName} from './UserName.brand'
import {RealLifeInfo} from './UserNameAndAvatar.brand'
import {ClubUuid} from './clubs'
import {NotificationCypher} from './notifications/NotificationCypher.brand'
import {VexlNotificationTokenNotTemporary} from './notifications/VexlNotificationToken'
import {FriendLevel, GoldenAvatarType, OfferId, OneOfferInState} from './offers'
import {TradeChecklistUpdate} from './tradeChecklist'

export const MessageType = Schema.Literal(
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
  'MESSAGE_READ'
)
export type MessageType = typeof MessageType.Type

export const ChatUserIdentity = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  clubsIds: Schema.optional(Schema.Array(ClubUuid)),
  realLifeInfo: Schema.optional(RealLifeInfo),
})
export type ChatUserIdentity = typeof ChatUserIdentity.Type

export const ChatMessageId = Schema.UUID.pipe(Schema.brand('ChatMessageId'))
export type ChatMessageId = typeof ChatMessageId.Type

export const RepliedToData = Schema.Struct({
  text: Schema.String,
  messageAuthor: Schema.Literal('me', 'them'),
  image: Schema.optional(UriString),
})
export type RepliedToData = typeof RepliedToData.Type

export const RepliedToDataPayload = Schema.Struct({
  text: Schema.String,
  messageAuthor: Schema.Literal('me', 'them'),
  image: Base64String,
})
export type RepliedToDataPayload = typeof RepliedToDataPayload.Type

export const ChatMessagePayload = Schema.Struct({
  uuid: ChatMessageId,
  text: Schema.optional(Schema.String),
  image: Schema.optional(UriString),
  repliedTo: Schema.optional(RepliedToData),
  time: UnixMilliseconds,
  messageType: MessageType,
  lastReceivedVersion: Schema.optional(SemverString),
  myVersion: Schema.optional(SemverString),
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdate),
  minimalRequiredVersion: Schema.optional(SemverString),
  deanonymizedUser: Schema.optional(
    Schema.Struct({
      name: UserName,
      imageBase64: Schema.optional(Base64String),
      partialPhoneNumber: Schema.optional(Schema.String),
      fullPhoneNumber: Schema.optional(E164PhoneNumber),
    })
  ),
  // Accepts both NotificationCypher (legacy) and VexlNotificationToken (new)
  myFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  lastReceivedFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // New dedicated fields for vexl notification tokens
  myVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  lastReceivedVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuid)),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
})
export type ChatMessagePayload = typeof ChatMessagePayload.Type

export function generateChatMessageId(): ChatMessageId {
  return Schema.decodeSync(ChatMessageId)(generateUuid())
}

export const ChatMessage = Schema.Struct({
  uuid: ChatMessageId,
  text: Schema.String,
  minimalRequiredVersion: Schema.optional(SemverString),
  time: UnixMilliseconds,
  myVersion: Schema.optional(SemverString),
  goldenAvatarType: Schema.optional(GoldenAvatarType),

  /**
   * Used only for messages  of type `VERSION_UPDATE`
   */
  lastReceivedVersion: Schema.optional(SemverString),
  forceShow: Schema.optional(Schema.Boolean),

  image: Schema.optional(UriString),
  repliedTo: Schema.optional(RepliedToData),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdate),
  deanonymizedUser: Schema.optional(DeanonymizedUser),
  senderPublicKey: PublicKeyPemBase64,
  messageType: MessageType,
  // Accepts both NotificationCypher (legacy) and VexlNotificationToken (new)
  myFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  lastReceivedFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // New dedicated fields for vexl notification tokens
  myVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  lastReceivedVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuid)),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
  friendLevel: Schema.optional(Schema.Array(FriendLevel)),
})
export type ChatMessage = typeof ChatMessage.Type

export const Inbox = Schema.Struct({
  privateKey: PrivateKeyHolder,
  // if the user is author of the offer
  offerId: Schema.optional(OfferId),
  // If the user has requested the offer
  requestOfferId: Schema.optional(OfferId),
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

export const MyNotificationTokenInfo = Schema.Struct({
  token: ExpoNotificationToken,
  cypher: NotificationCypher,
})
export type MyNotificationTokenInfo = typeof MyNotificationTokenInfo.Type

export const Chat = Schema.Struct({
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
  otherSideVersion: Schema.optional(SemverString),
  lastReportedVersion: Schema.optional(SemverString),
  // Accepts both NotificationCypher (legacy) and VexlNotificationToken (new)
  otherSideFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // New dedicated fields for vexl notification tokens
  otherSideVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  lastReportedVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  lastReadByOtherSide: Schema.optional(UnixMilliseconds),
})
export type Chat = typeof Chat.Type

export const MessageCypher = Schema.String.pipe(Schema.brand('MessageCypher'))
export type MessageCypher = typeof MessageCypher.Type

export const ServerMessage = Schema.Struct({
  message: MessageCypher,
  senderPublicKey: PublicKeyPemBase64,
})
export type ServerMessage = typeof ServerMessage.Type

export const ChatMessageRequiringNewerVersion = Schema.Struct({
  uuid: ChatMessageId,
  messageType: Schema.Literal('REQUIRES_NEWER_VERSION'),
  serverMessage: ServerMessage,
  myVersion: Schema.optionalWith(SemverString, {nullable: true}),
  minimalRequiredVersion: SemverString,
  time: UnixMilliseconds,
  senderPublicKey: PublicKeyPemBase64,
  messageParsed: Schema.optional(Schema.Unknown),
  text: Schema.Literal('-'),
  deanonymizedUser: Schema.optional(Schema.Undefined),
  image: Schema.optional(Schema.Undefined),
  // Accepts both NotificationCypher (legacy) and VexlNotificationToken (new)
  myFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  lastReceivedFcmCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // New dedicated fields for vexl notification tokens
  myVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  lastReceivedVexlToken: Schema.optional(VexlNotificationTokenNotTemporary),
  commonFriends: Schema.optional(Schema.Array(HashedPhoneNumber)),
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
