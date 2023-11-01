import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  Chat,
  ChatId,
  ChatMessage,
  Inbox,
} from '@vexl-next/domain/dist/general/messaging'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {
  type BadStatusCodeError,
  type NetworkError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '@vexl-next/rest-api/dist/Errors'
import {
  type ErrorGeneratingChallenge,
  type ErrorSigningChallenge,
} from '@vexl-next/rest-api/dist/services/chat/utils'
import {
  type InboxDoesNotExist,
  type NotPermittedToSendMessageToTargetInbox,
} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {z} from 'zod'
import {type ReadingFileError} from './utils/replaceImageFileUrisWithBase64'

export type ApiErrorCreatingInbox = BasicError<'ApiErrorCreatingInbox'>
export type ErrorInboxAlreadyExists = BasicError<'ErrorInboxAlreadyExists'>

export const ChatMessageWithState = z.discriminatedUnion('state', [
  z.object({state: z.literal('received'), message: ChatMessage}),
  z.object({state: z.literal('sending'), message: ChatMessage}),
  z.object({
    state: z.literal('sendingError'),
    message: ChatMessage,
    error: z.custom<
      | ErrorEncryptingMessage
      | UnexpectedApiResponseError
      | BadStatusCodeError
      | UnknownError
      | NetworkError
      | ErrorGeneratingChallenge
      | ErrorSigningChallenge
      | InboxDoesNotExist
      | NotPermittedToSendMessageToTargetInbox
      | ReadingFileError
    >((one) => !!(one as any)._tag),
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

export const RequestState = z.enum([
  'initial',
  'requested',
  'denied',
  'cancelled',
  'accepted',
  'deleted',
  'otherSideLeft',
])
export type RequestState = z.TypeOf<typeof RequestState>
