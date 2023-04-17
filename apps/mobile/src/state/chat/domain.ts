import {z} from 'zod'
import {
  Chat,
  ChatMessage,
  Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type ApiErrorSendMessage} from '@vexl-next/resources-utils/dist/chat/sendMessage'

export type ApiErrorCreatingInbox = BasicError<'ApiErrorCreatingInbox'>
export type ErrorInboxAlreadyExists = BasicError<'ErrorInboxAlreadyExists'>

export const ChatMessageWithState = z.discriminatedUnion('state', [
  z.object({state: z.literal('received'), message: ChatMessage}),
  z.object({state: z.literal('sending'), message: ChatMessage}),
  z.object({
    state: z.literal('sendingError'),
    message: ChatMessage,
    error: z.custom<ErrorEncryptingMessage | ApiErrorSendMessage>(
      (one) =>
        (one as any)._tag === 'ErrorEncryptingMessage' ||
        (one as any)._tag === 'ApiErrorSendMessage'
    ),
  }),
  z.object({state: z.literal('sent'), message: ChatMessage}),
])
export type ChatMessageWithState = z.TypeOf<typeof ChatMessageWithState>

export const ChatWithMessages = Chat.extend({
  messages: z.array(ChatMessageWithState),
})
export type ChatWithMessages = z.TypeOf<typeof ChatWithMessages>

export const InboxInState = z.object({
  inbox: Inbox,
  chats: z.array(ChatWithMessages),
})
export type InboxInState = z.TypeOf<typeof InboxInState>

export const ChatState = z.array(InboxInState)
export type ChatState = z.TypeOf<typeof ChatState>
