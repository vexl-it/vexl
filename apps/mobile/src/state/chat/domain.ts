import {
  generatePrivateKey,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  Chat,
  ChatId,
  ChatMessage,
  ChatMessageRequiringNewerVersion,
  generateChatId,
  Inbox,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {type SenderInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  type ForbiddenMessageTypeError,
  type InboxDoesNotExistError,
  type NotPermittedToSendMessageToTargetInboxError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {
  type ErrorSigningChallenge,
  type InvalidChallengeError,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {z} from 'zod'
import {
  createEmptyTradeChecklistInState,
  TradeChecklistInState,
} from '../tradeChecklist/domain'
import {type ReadingFileError} from './utils/replaceImageFileUrisWithBase64'

export type ApiErrorCreatingInbox = BasicError<'ApiErrorCreatingInbox'>
export type ErrorInboxAlreadyExists = BasicError<'ErrorInboxAlreadyExists'>

export const ChatMessageWithState = z
  .discriminatedUnion('state', [
    z.object({state: z.literal('received'), message: ChatMessage}),
    z.object({
      state: z.literal('receivedButRequiresNewerVersion'),
      message: ChatMessageRequiringNewerVersion,
    }),
    z.object({state: z.literal('sending'), message: ChatMessage}),
    z.object({
      state: z.literal('sendingError'),
      message: ChatMessage,
      error: z.custom<
        | ErrorEncryptingMessage
        | ErrorGeneratingChallenge
        | ErrorSigningChallenge
        | InvalidChallengeError
        | InboxDoesNotExistError
        | NotPermittedToSendMessageToTargetInboxError
        | JsonStringifyError
        | ZodParseError<ChatMessagePayload>
        | ReadingFileError
        | SenderInboxDoesNotExistError
        | ForbiddenMessageTypeError
        | CryptoError
        | {_tag: string}
      >((one) => !!one._tag),
    }),
    z.object({state: z.literal('sent'), message: ChatMessage}),
  ])
  .readonly()
export type ChatMessageWithState = z.TypeOf<typeof ChatMessageWithState>

export const ChatWithMessages = z
  .object({
    chat: Chat,
    messages: z.array(ChatMessageWithState),
    tradeChecklist: TradeChecklistInState.default({
      dateAndTime: {},
      location: {},
      amount: {},
      network: {},
      identity: {},
      contact: {},
    }),
  })
  .readonly()
export type ChatWithMessages = z.TypeOf<typeof ChatWithMessages>

export const InboxInState = z
  .object({
    inbox: Inbox,
    chats: z.array(ChatWithMessages),
  })
  .readonly()
export type InboxInState = z.TypeOf<typeof InboxInState>

export const MessagingState = z.array(InboxInState)
export type MessagingState = z.TypeOf<typeof MessagingState>

export const ChatIds = z
  .object({
    chatId: ChatId,
    inboxKey: PublicKeyPemBase64,
  })
  .readonly()
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

export const dummyChatWithMessages: ChatWithMessages = {
  chat: {
    id: generateChatId(),
    inbox: {privateKey: generatePrivateKey()},
    otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
    origin: {type: 'unknown'},
    isUnread: false,
    showInfoBar: true,
    showVexlbotInitialMessage: true,
    showVexlbotNotifications: true,
  },
  tradeChecklist: {
    ...createEmptyTradeChecklistInState(),
  },
  messages: [],
}
