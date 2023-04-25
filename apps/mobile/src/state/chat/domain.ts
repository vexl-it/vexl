import {z} from 'zod'
import {
  Chat,
  ChatId,
  ChatMessage,
  Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type SendMessageApiErrors} from '@vexl-next/resources-utils/dist/chat/sendMessage'

export type ApiErrorCreatingInbox = BasicError<'ApiErrorCreatingInbox'>
export type ErrorInboxAlreadyExists = BasicError<'ErrorInboxAlreadyExists'>

export const ChatMessageWithState = z.discriminatedUnion('state', [
  z.object({state: z.literal('received'), message: ChatMessage}),
  z.object({state: z.literal('sending'), message: ChatMessage}),
  z.object({
    state: z.literal('sendingError'),
    message: ChatMessage,
    error: z.custom<ErrorEncryptingMessage | SendMessageApiErrors>(
      (one) =>
        (one as any)._tag === 'ErrorEncryptingMessage' ||
        (one as any)._tag === 'inboxDoesNotExist' ||
        (one as any)._tag === 'notPermittedToSendMessageToTargetInbox'
    ),
  }),
  z.object({state: z.literal('sent'), message: ChatMessage}),
])
export type ChatMessageWithState = z.TypeOf<typeof ChatMessageWithState>

export const ChatWithMessages = z.object({
  chat: Chat,
  messages: z.array(ChatMessageWithState),
})
export type ChatWithMessages = z.TypeOf<typeof ChatWithMessages>

export const InboxInState = z.object({
  inbox: Inbox,
  chats: z.array(ChatWithMessages),
})
export type InboxInState = z.TypeOf<typeof InboxInState>

export const MessagingState = z.array(InboxInState)
export type MessagingState = z.TypeOf<typeof MessagingState>

export const ChatIds = z.object({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatIds = z.TypeOf<typeof ChatIds>
