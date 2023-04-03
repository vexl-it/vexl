import {z} from 'zod'
import {UserNameAndAvatar} from './UserNameAndAvatar.brand'
import {OfferId} from './offers'
import {UserName} from './UserName.brand'
import {Uuid} from '../utility/Uuid.brand'
import {Base64String} from '../utility/Base64String.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {KeyHolder} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const MessageType = z
  .enum([
    'MESSAGE',
    'REQUEST_REVEAL',
    'APPROVE_REVEAL',
    'DISAPPROVE_REVEAL',
    'REQUEST_MESSAGING',
    'APPROVE_MESSAGING',
    'DISAPPROVE_MESSAGING',
    'DELETE_CHAT',
    'BLOCK_CHAT',
  ])
  .brand<'messageType'>()
export type MessageType = z.TypeOf<typeof MessageType>

export const MessageTypes = {
  MESSAGE: MessageType.parse('MESSAGE'),
  REQUEST_REVEAL: MessageType.parse('REQUEST_REVEAL'),
  APPROVE_REVEAL: MessageType.parse('APPROVE_REVEAL'),
  DISAPPROVE_REVEAL: MessageType.parse('DISAPPROVE_REVEAL'),
  REQUEST_MESSAGING: MessageType.parse('REQUEST_MESSAGING'),
  APPROVE_MESSAGING: MessageType.parse('APPROVE_MESSAGING'),
  DISAPPROVE_MESSAGING: MessageType.parse('DISAPPROVE_MESSAGING'),
  DELETE_CHAT: MessageType.parse('DELETE_CHAT'),
  BLOCK_CHAT: MessageType.parse('BLOCK_CHAT'),
}

export const ChatUserIdentity = z.object({
  publicKey: PublicKeyPemBase64,
  anonymousInfo: UserNameAndAvatar.optional(),
  realLifeInfo: UserNameAndAvatar.optional(),
})
export type ChatUserIdentity = z.TypeOf<typeof ChatUserIdentity>

export const DeanonymizedUser = z.object({
  name: UserName,
  imageBase64: Base64String,
})
export type DeanonymizedUser = z.TypeOf<typeof DeanonymizedUser>

//
export const ChatMessagePayload = z.object({
  uuid: Uuid,
  text: z.string(),
  image: Base64String.optional(),
  time: UnixMilliseconds,
  deanonymizedUser: DeanonymizedUser.optional(),
})
export type ChatMessagePayload = z.TypeOf<typeof ChatMessagePayload>

export const MessageFlags = z.object({
  isMine: z.boolean(),
})
export type MessageFlags = z.TypeOf<typeof MessageFlags>

export const ChatMessage = z.object({
  uuid: Uuid,
  text: z.string(),
  time: UnixMilliseconds,
  image: Base64String.optional(),
  deanonymizedUser: DeanonymizedUser.optional(),
  senderPublicKey: PublicKeyPemBase64,
  messageType: MessageType,
  sent: z.boolean(),
  isMine: z.boolean(),
})
export type ChatMessage = z.TypeOf<typeof ChatMessage>

//

export const Inbox = z.object({
  privateKey: KeyHolder.PrivateKeyHolder,
  offerId: OfferId.optional(),
})
export type Inbox = z.TypeOf<typeof Inbox>

export const ChatOrigin = z.object({
  type: z.enum(['myOffer', 'theirOffer']),
  offerPublicKey: KeyHolder.PublicKeyPemBase64,
})
export type ChatOrigin = z.TypeOf<typeof ChatOrigin>

export const ChatId = z.string().uuid().brand<'chatId'>()
export type ChatId = z.TypeOf<typeof ChatId>
export const Chat = z.object({
  id: ChatId,
  inbox: Inbox,
  origin: ChatOrigin,
  otherSide: ChatUserIdentity,
  messages: z.array(ChatMessage),
})
export type Chat = z.TypeOf<typeof Chat>
