import {z} from 'zod'
import {IdNumeric} from '../utility/IdNumeric'
import {UserNameAndAvatar} from './UserNameAndAvatar.brand'
import {PrivateKey} from '@vexl-next/cryptography'
import {UriString} from '../utility/UriString.brand'
import {OfferId} from './OfferInfo'
import {Base64String} from '../utility/Base64String.brand'
import {UserName} from './UserName.brand'

/*
val id: Long,
	val contactPublicKey: String,
	val inboxKey: String,
	val name: String? = null,
	val anonymousUsername: String? = null,
	val avatarBase64: String? = null,
	val anonymousAvatarImageIndex: Int? = null,
	val deAnonymized: Boolean
 */

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

export const ChatUserIdentity = z
  .object({
    publicKey: z.string(),
    anonymousInfo: UserNameAndAvatar.optional(),
    realLifeInfo: UserNameAndAvatar.optional(),
  })
  .brand<'ChatUserIdentity'>()
export type ChatUserIdentity = z.TypeOf<typeof ChatUserIdentity>

export const DeanonymizedUser = z
  .object({
    name: UserName,
    avatar: Base64String,
  })
  .brand<'DeanonymizedUser'>()
export type DeanonymizedUser = z.TypeOf<typeof DeanonymizedUser>

export const ChatMessageEncodedPayload = z.object({
  uuid: z.string().uuid(),
  text: z.string(),
  image: Base64String.optional(),
  time: z.number().int().positive(),
  deanonymizedUser: DeanonymizedUser.optional(),
})
export type ChatMessageEncodedPayload = z.TypeOf<
  typeof ChatMessageEncodedPayload
>

export const ChatMessage = ChatMessageEncodedPayload.extend({
  id: IdNumeric,
  type: MessageType,
  isMine: z.boolean(),
  senderPublicKey: z.string(),
}).brand<'ChatMessage'>()
export type ChatMessage = z.TypeOf<typeof ChatMessage>

export const Inbox = z.object({
  privateKey: z.custom<PrivateKey>((x) => x instanceof PrivateKey),
  offerId: OfferId.optional(),
})
export type Inbox = z.TypeOf<typeof Inbox>

export const ChatOrigin = z.object({
  type: z.enum(['myOffer', 'theirOffer']),
  offerPublicKey: z.string(),
})
export type ChatOrigin = z.TypeOf<typeof ChatOrigin>

export const ChatId = z.string().uuid().brand<'chatId'>()
export type ChatId = z.TypeOf<typeof ChatId>
export const Chat = z
  .object({
    id: ChatId,
    inbox: Inbox,
    origin: ChatOrigin,
    otherSide: ChatUserIdentity,
    messages: z.array(ChatMessage),
  })
  .brand<'Chat'>()
export type Chat = z.TypeOf<typeof Chat>

//
// fun ChatMessage.toNetwork(receiverPublicKey: String): String {
//   val request = ChatMessageRequest(
//     uuid = this.uuid,
//     text = this.text,
//     image = this.image,
//     time = this.time,
//     deanonymizedUser = this.deanonymizedUser?.toNetwork()
//   )
//
//   val moshi = Moshi.Builder().build()
//   val jsonAdapter: JsonAdapter<ChatMessageRequest> = moshi.adapter(ChatMessageRequest::class.java)
//
//   val string = jsonAdapter.toJson(request)
//   val result = string?.let {
//     EciesCryptoLib.encrypt(receiverPublicKey, it)
//   }
//   return result ?: ""
// }
