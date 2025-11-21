import {KeyHolder} from '@vexl-next/cryptography/src'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyHolderE,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Brand, Schema} from 'effect'
import {z} from 'zod'
import {Base64String, Base64StringE} from '../utility/Base64String.brand'
import {
  ExpoNotificationToken,
  ExpoNotificationTokenE,
} from '../utility/ExpoNotificationToken.brand'
import {SemverString, SemverStringE} from '../utility/SmeverString.brand'
import {
  UnixMilliseconds,
  UnixMillisecondsE,
} from '../utility/UnixMilliseconds.brand'
import {UriString, UriStringE} from '../utility/UriString.brand'
import {Uuid, generateUuid} from '../utility/Uuid.brand'
import {DeanonymizedUser, DeanonymizedUserE} from './DeanonymizedUser'
import {E164PhoneNumber, E164PhoneNumberE} from './E164PhoneNumber.brand'
import {UserName, UserNameE} from './UserName.brand'
import {RealLifeInfo, RealLifeInfoE} from './UserNameAndAvatar.brand'
import {ClubUuid, ClubUuidE} from './clubs'
import {
  NotificationCypher,
  NotificationCypherE,
} from './notifications/NotificationCypher.brand'
import {
  GoldenAvatarType,
  GoldenAvatarTypeE,
  OfferId,
  OfferIdE,
  OneOfferInState,
  OneOfferInStateE,
} from './offers'
import {TradeChecklistUpdate, TradeChecklistUpdateE} from './tradeChecklist'

export const MessageType = z.enum([
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
])
export const MessageTypeE = Schema.Literal(
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
  'FCM_CYPHER_UPDATE'
)
export type MessageType = Schema.Schema.Type<typeof MessageTypeE>

export const ChatUserIdentity = z
  .object({
    publicKey: PublicKeyPemBase64,
    goldenAvatarType: GoldenAvatarType.optional(),
    clubsIds: z.array(ClubUuid).optional().readonly(),
    realLifeInfo: RealLifeInfo.optional(),
  })
  .readonly()
export const ChatUserIdentityE = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  goldenAvatarType: Schema.optional(GoldenAvatarTypeE),
  clubsIds: Schema.optional(Schema.Array(ClubUuidE)),
  realLifeInfo: Schema.optional(RealLifeInfoE),
})
export type ChatUserIdentity = Schema.Schema.Type<typeof ChatUserIdentityE>

export const ChatMessageId = z
  .string()
  .uuid()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'ChatMessageId'>>()(v))
export const ChatMessageIdE = Schema.UUID.pipe(Schema.brand('ChatMessageId'))
export type ChatMessageId = Schema.Schema.Type<typeof ChatMessageIdE>

export const RepliedToData = z
  .object({
    text: z.string(),
    messageAuthor: z.enum(['me', 'them']),
    image: UriString.optional(),
  })
  .readonly()
export const RepliedToDataE = Schema.Struct({
  text: Schema.String,
  messageAuthor: Schema.Literal('me', 'them'),
  image: Schema.optional(UriStringE),
})
export type RepliedToData = Schema.Schema.Type<typeof RepliedToDataE>

export const RepliedToDataPayload = z
  .object({
    text: z.string(),
    messageAuthor: z.enum(['me', 'them']),
    image: Base64String.optional(),
  })
  .readonly()
export const RepliedToDataPayloadE = Schema.Struct({
  text: Schema.String,
  messageAuthor: Schema.Literal('me', 'them'),
  image: Base64StringE,
})

export type RepliedToDataPayload = typeof RepliedToDataPayloadE.Type

export const ChatMessagePayload = z
  .object({
    uuid: ChatMessageId,
    text: z.string().optional(),
    image: UriString.optional(),
    repliedTo: RepliedToData.optional(),
    time: UnixMilliseconds,
    messageType: MessageType,
    lastReceivedVersion: SemverString.optional(),
    myVersion: SemverString.optional(),
    goldenAvatarType: GoldenAvatarType.optional(),
    tradeChecklistUpdate: TradeChecklistUpdate.optional(),
    minimalRequiredVersion: SemverString.optional(),
    deanonymizedUser: z
      .object({
        name: UserName,
        imageBase64: Base64String.optional(),
        partialPhoneNumber: z.string().optional(),
        fullPhoneNumber: E164PhoneNumber.optional(),
      })
      .optional()
      .readonly(),
    myFcmCypher: NotificationCypher.optional(),
    lastReceivedFcmCypher: NotificationCypher.optional(),
    senderClubsUuids: z.array(ClubUuid).optional().readonly(),
  })
  .readonly()

export const ChatMessagePayloadE = Schema.Struct({
  uuid: ChatMessageIdE,
  text: Schema.optional(Schema.String),
  image: Schema.optional(UriStringE),
  repliedTo: Schema.optional(RepliedToDataE),
  time: UnixMillisecondsE,
  messageType: MessageTypeE,
  lastReceivedVersion: Schema.optional(SemverStringE),
  myVersion: Schema.optional(SemverStringE),
  goldenAvatarType: Schema.optional(GoldenAvatarTypeE),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdateE),
  minimalRequiredVersion: Schema.optional(SemverStringE),
  deanonymizedUser: Schema.optional(
    Schema.Struct({
      name: UserNameE,
      imageBase64: Schema.optional(Base64StringE),
      partialPhoneNumber: Schema.optional(Schema.String),
      fullPhoneNumber: Schema.optional(E164PhoneNumberE),
    })
  ),
  myFcmCypher: Schema.optional(NotificationCypherE),
  lastReceivedFcmCypher: Schema.optional(NotificationCypherE),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuidE)),
})
export type ChatMessagePayload = Schema.Schema.Type<typeof ChatMessagePayloadE>

export function generateChatMessageId(): ChatMessageId {
  return ChatMessageId.parse(generateUuid())
}

export const ChatMessage = z
  .object({
    uuid: ChatMessageId,
    text: z.string(),
    minimalRequiredVersion: SemverString.optional(),
    time: UnixMilliseconds,
    myVersion: SemverString.optional(),
    goldenAvatarType: GoldenAvatarType.optional(),

    /**
     * Used only for messages  of type `VERSION_UPDATE`
     */
    lastReceivedVersion: SemverString.optional(),
    forceShow: z.boolean().optional(),

    image: UriString.optional(),
    repliedTo: RepliedToData.optional(),
    tradeChecklistUpdate: TradeChecklistUpdate.optional(),
    deanonymizedUser: DeanonymizedUser.optional(),
    senderPublicKey: PublicKeyPemBase64,
    messageType: MessageType,

    myFcmCypher: NotificationCypher.optional(),
    lastReceivedFcmCypher: NotificationCypher.optional(),
    senderClubsUuids: z.array(ClubUuid).optional().readonly(),
  })
  .readonly()

const ChatMessageE = Schema.Struct({
  uuid: ChatMessageIdE,
  text: Schema.String,
  minimalRequiredVersion: Schema.optional(SemverStringE),
  time: UnixMillisecondsE,
  myVersion: Schema.optional(SemverStringE),
  goldenAvatarType: Schema.optional(GoldenAvatarTypeE),

  /**
   * Used only for messages  of type `VERSION_UPDATE`
   */
  lastReceivedVersion: Schema.optional(SemverStringE),
  forceShow: Schema.optional(Schema.Boolean),

  image: Schema.optional(UriStringE),
  repliedTo: Schema.optional(RepliedToDataE),
  tradeChecklistUpdate: Schema.optional(TradeChecklistUpdateE),
  deanonymizedUser: Schema.optional(DeanonymizedUserE),
  senderPublicKey: PublicKeyPemBase64E,
  messageType: MessageTypeE,
  myFcmCypher: Schema.optional(NotificationCypherE),
  lastReceivedFcmCypher: Schema.optional(NotificationCypherE),
  senderClubsUuids: Schema.optional(Schema.Array(ClubUuidE)),
})

export type ChatMessage = typeof ChatMessageE.Type

export const Inbox = z
  .object({
    privateKey: KeyHolder.PrivateKeyHolder,
    offerId: OfferId.optional(),
    requestOfferId: OfferId.optional(),
  })
  .readonly()
export const InboxE = Schema.Struct({
  privateKey: PrivateKeyHolderE,
  // if the user is author of the offer
  offerId: Schema.optional(OfferIdE),
  // If the user has requested the offer
  requestOfferId: Schema.optional(OfferIdE),
})
export type Inbox = Schema.Schema.Type<typeof InboxE>

export const ChatOrigin = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('myOffer'),
      offerId: OfferId,
      offer: OneOfferInState.optional(),
    }),
    z.object({
      type: z.literal('theirOffer'),
      offerId: OfferId,
      offer: OneOfferInState.optional(),
    }),
    z.object({type: z.literal('unknown')}),
  ])
  .readonly()

export const ChatOriginE = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('myOffer'),
    offerId: OfferIdE,
    offer: Schema.optional(OneOfferInStateE),
  }),
  Schema.Struct({
    type: Schema.Literal('theirOffer'),
    offerId: OfferIdE,
    offer: Schema.optional(OneOfferInStateE),
  }),
  Schema.Struct({type: Schema.Literal('unknown')})
)
export type ChatOrigin = Schema.Schema.Type<typeof ChatOriginE>

export const ChatId = z
  .string()
  .uuid()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'ChatId'>>()(v))

export const ChatIdE = Schema.String.pipe(Schema.brand('ChatId'))
export type ChatId = Schema.Schema.Type<typeof ChatIdE>

export function generateChatId(): ChatId {
  return ChatId.parse(Uuid.parse(generateUuid()))
}

export const CalendarEventId = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'CalendarEventId'>>()(v)
  )
export const CalendarEventIdE = Schema.String.pipe(
  Schema.brand('CalendarEventId')
)
export type CalendarEventId = Schema.Schema.Type<typeof CalendarEventIdE>

export const MyNotificationTokenInfo = z.object({
  token: ExpoNotificationToken,
  cypher: NotificationCypher,
})
export const MyNotificationTokenInfoE = Schema.Struct({
  token: ExpoNotificationTokenE,
  cypher: NotificationCypherE,
})
export type MyNotificationTokenInfo = Schema.Schema.Type<
  typeof MyNotificationTokenInfoE
>

export const Chat = z.object({
  id: ChatId,
  inbox: Inbox,
  origin: ChatOrigin,
  otherSide: ChatUserIdentity,
  isUnread: z.boolean().default(true),
  showInfoBar: z.boolean().default(true),
  showVexlbotNotifications: z.boolean().default(true),
  showVexlbotInitialMessage: z.boolean().default(true),
  tradeChecklistCalendarEventId: CalendarEventId.optional(),
  tradeReminderNotificationId: z.string().optional(),
  otherSideVersion: SemverString.optional(),
  lastReportedVersion: SemverString.optional(),
  otherSideFcmCypher: NotificationCypher.optional(),
  lastReportedFcmToken: MyNotificationTokenInfo.optional(),
})
export const ChatE = Schema.Struct({
  id: ChatIdE,
  inbox: InboxE,
  origin: ChatOriginE,
  otherSide: ChatUserIdentityE,
  isUnread: Schema.optionalWith(Schema.Boolean, {default: () => true}),
  showInfoBar: Schema.optionalWith(Schema.Boolean, {default: () => true}),
  showVexlbotNotifications: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showVexlbotInitialMessage: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  tradeChecklistCalendarEventId: Schema.optional(CalendarEventIdE),
  tradeReminderNotificationId: Schema.optional(Schema.String),
  otherSideVersion: Schema.optional(SemverStringE),
  lastReportedVersion: Schema.optional(SemverStringE),
  otherSideFcmCypher: Schema.optional(NotificationCypherE),
  lastReportedFcmToken: Schema.optional(MyNotificationTokenInfoE),
})
export type Chat = Schema.Schema.Type<typeof ChatE>

export const ServerMessage = z.object({
  message: z.string(),
  senderPublicKey: PublicKeyPemBase64,
})
export const ServerMessageE = Schema.Struct({
  message: Schema.String,
  senderPublicKey: PublicKeyPemBase64E,
})
export type ServerMessage = Schema.Schema.Type<typeof ServerMessageE>

export const ChatMessageRequiringNewerVersion = z.object({
  uuid: ChatMessageId,
  messageType: z.literal('REQUIRES_NEWER_VERSION'),
  serverMessage: ServerMessage,
  myVersion: SemverString.optional(),
  minimalRequiredVersion: SemverString,
  time: UnixMilliseconds,
  senderPublicKey: PublicKeyPemBase64,
  messageParsed: z.unknown(),
  text: z.literal('-'),
  deanonymizedUser: z.undefined(),
  image: z.undefined(),
  myFcmCypher: NotificationCypher.optional(),
  lastReceivedFcmCypher: NotificationCypher.optional(),
})

export const ChatMessageRequiringNewerVersionE = Schema.Struct({
  uuid: ChatMessageIdE,
  messageType: Schema.Literal('REQUIRES_NEWER_VERSION'),
  serverMessage: ServerMessageE,
  myVersion: Schema.optional(SemverStringE),
  minimalRequiredVersion: SemverStringE,
  time: UnixMillisecondsE,
  senderPublicKey: PublicKeyPemBase64E,
  messageParsed: Schema.optional(Schema.Unknown),
  text: Schema.Literal('-'),
  deanonymizedUser: Schema.optional(Schema.Undefined),
  image: Schema.optional(Schema.Undefined),
  myFcmCypher: Schema.optional(NotificationCypherE),
  lastReceivedFcmCypher: Schema.optional(NotificationCypherE),
})

export type ChatMessageRequiringNewerVersion =
  typeof ChatMessageRequiringNewerVersionE.Type
