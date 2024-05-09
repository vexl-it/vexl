import {KeyHolder} from '@vexl-next/cryptography/src'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {z} from 'zod'
import {Base64String} from '../utility/Base64String.brand'
import {SemverString} from '../utility/SmeverString.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {UriString} from '../utility/UriString.brand'
import {Uuid, generateUuid} from '../utility/Uuid.brand'
import {DeanonymizedUser} from './DeanonymizedUser'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'
import {RealLifeInfo} from './UserNameAndAvatar.brand'
import {OfferId, OneOfferInState} from './offers'
import {TradeChecklistUpdate} from './tradeChecklist'

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
])
export type MessageType = z.TypeOf<typeof MessageType>

export const ChatUserIdentity = z.object({
  publicKey: PublicKeyPemBase64,
  realLifeInfo: RealLifeInfo.optional(),
})
export type ChatUserIdentity = z.TypeOf<typeof ChatUserIdentity>

export const ChatMessageId = z.string().uuid().brand<'ChatMessageId'>()
export type ChatMessageId = z.TypeOf<typeof ChatMessageId>

export const RepliedToData = z.object({
  text: z.string(),
  messageAuthor: z.enum(['me', 'them']),
  image: UriString.optional(),
})
export type RepliedToData = z.TypeOf<typeof RepliedToData>

export const RepliedToDataPayload = z.object({
  text: z.string(),
  messageAuthor: z.enum(['me', 'them']),
  image: Base64String.optional(),
})
export type RepliedToDataPayload = z.TypeOf<typeof RepliedToDataPayload>

export const ChatMessagePayload = z.object({
  uuid: ChatMessageId,
  text: z.string().optional(),
  image: UriString.optional(),
  repliedTo: RepliedToData.optional(),
  time: UnixMilliseconds,
  messageType: MessageType,
  lastReceivedVersion: SemverString.optional(),
  myVersion: SemverString.optional(),
  tradeChecklistUpdate: TradeChecklistUpdate.optional(),
  minimalRequiredVersion: SemverString.optional(),
  deanonymizedUser: z
    .object({
      name: UserName,
      imageBase64: Base64String.optional(),
      partialPhoneNumber: z.string().optional(),
      fullPhoneNumber: E164PhoneNumber.optional(),
    })
    .optional(),
})
export type ChatMessagePayload = z.TypeOf<typeof ChatMessagePayload>

export function generateChatMessageId(): ChatMessageId {
  return ChatMessageId.parse(generateUuid())
}

export const ChatMessage = z.object({
  uuid: ChatMessageId,
  text: z.string(),
  minimalRequiredVersion: SemverString.optional(),
  time: UnixMilliseconds,
  myVersion: SemverString.optional(),

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
})
export type ChatMessage = z.TypeOf<typeof ChatMessage>
//

export const Inbox = z.object({
  privateKey: KeyHolder.PrivateKeyHolder,
  offerId: OfferId.optional(),
})
export type Inbox = z.TypeOf<typeof Inbox>

export const ChatOrigin = z.discriminatedUnion('type', [
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
export type ChatOrigin = z.TypeOf<typeof ChatOrigin>

export const ChatId = z.string().uuid().brand<'chatId'>()
export type ChatId = z.TypeOf<typeof ChatId>

export function generateChatId(): ChatId {
  return ChatId.parse(Uuid.parse(generateUuid()))
}

export const CalendarEventId = z.string().brand<'calendarEventId'>()
export type CalendarEventId = z.TypeOf<typeof CalendarEventId>

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
  otherSideVersion: SemverString.optional(),
  lastReportedVersion: SemverString.optional(),
})
export type Chat = z.TypeOf<typeof Chat>

export const ServerMessage = z.object({
  message: z.string(),
  senderPublicKey: PublicKeyPemBase64,
})
export type ServerMessage = z.TypeOf<typeof ServerMessage>

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
})
export type ChatMessageRequiringNewerVersion = z.infer<
  typeof ChatMessageRequiringNewerVersion
>
