import {
  generatePrivateKey,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  Chat,
  ChatId,
  ChatMessage,
  ChatMessageId,
  ChatMessageRequiringNewerVersion,
  generateChatId,
  Inbox,
} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {JsonStringifyError} from '@vexl-next/resources-utils/src/utils/parsing'
import {
  ErrorSigningChallenge,
  InvalidChallengeError,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {SenderInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  ForbiddenMessageTyperror,
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {HashSet, Schema} from 'effect/index'
import {
  createEmptyTradeChecklistInState,
  TradeChecklistInState,
} from '../tradeChecklist/domain'
import {ReadingFileError} from './utils/replaceImageFileUrisWithBase64'
export class ApiErrorCreatingInbox extends Schema.TaggedError<ApiErrorCreatingInbox>(
  'ApiErrorCreatingInbox'
)('ApiErrorCreatingInbox', {
  cause: Schema.Unknown,
}) {}
export class ErrorInboxAlreadyExists extends Schema.TaggedError<ErrorInboxAlreadyExists>(
  'ErrorInboxAlreadyExists'
)('ErrorInboxAlreadyExists', {
  cause: Schema.Unknown,
}) {}

export const ReceivedMessage = Schema.Struct({
  state: Schema.Literal('received'),
  message: ChatMessage,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
})

export const ReceivedButRequiresNewerVersionMessage = Schema.Struct({
  state: Schema.Literal('receivedButRequiresNewerVersion'),
  message: ChatMessageRequiringNewerVersion,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
})

export const SendingMessage = Schema.Struct({
  state: Schema.Literal('sending'),
  message: ChatMessage,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
})

export const SentMessage = Schema.Struct({
  state: Schema.Literal('sent'),
  message: ChatMessage,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
})

export const SendingErrorMessage = Schema.Struct({
  state: Schema.Literal('sendingError'),
  message: ChatMessage,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
  error: Schema.Union(
    ErrorEncryptingMessage,
    ErrorGeneratingChallenge,
    ErrorSigningChallenge,
    InvalidChallengeError,
    InboxDoesNotExistError,
    NotPermittedToSendMessageToTargetInboxError,
    JsonStringifyError,
    Schema.Struct({_tag: Schema.String}),
    ReadingFileError,
    SenderInboxDoesNotExistError,
    ForbiddenMessageTyperror,
    CryptoError
  ),
})

export const ChatMessageWithState = Schema.Union(
  ReceivedMessage,
  ReceivedButRequiresNewerVersionMessage,
  SendingMessage,
  SentMessage,
  SendingErrorMessage
)
export type ChatMessageWithState = typeof ChatMessageWithState.Type

// Used for messages that are grouped to another messages...
// Usually that includes chat messages for example
export const ChatTransientMessageId = Schema.String.pipe(
  Schema.brand('ChatTransientMessageId')
)
export type ChatTransientMessageId = typeof ChatTransientMessageId.Type

export const ChatWithMessages = Schema.Struct({
  chat: Chat,
  messages: Schema.Array(ChatMessageWithState).pipe(Schema.mutable),
  hiddenMessagesIds: Schema.HashSet(
    Schema.Union(ChatMessageId, ChatTransientMessageId)
  ).pipe(
    Schema.optionalWith({
      default: () => HashSet.empty<ChatMessageId | ChatTransientMessageId>(),
    })
  ),
  tradeChecklist: Schema.optionalWith(TradeChecklistInState, {
    default: () => ({
      dateAndTime: {},
      location: {},
      amount: {},
      network: {},
      identity: {},
      contact: {},
    }),
  }),
  feedbackSubmitted: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
})
export type ChatWithMessages = typeof ChatWithMessages.Type

export const InboxInState = Schema.Struct({
  inbox: Inbox,
  chats: Schema.Array(ChatWithMessages).pipe(Schema.mutable),
})
export type InboxInState = typeof InboxInState.Type

export const MessagingState = Schema.Array(InboxInState).pipe(Schema.mutable)
export type MessagingState = typeof MessagingState.Type

export const ChatIds = Schema.Struct({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatIds = typeof ChatIds.Type

export const RequestState = Schema.Literal(
  'initial',
  'requested',
  'denied',
  'cancelled',
  'accepted',
  'deleted',
  'otherSideLeft'
)
export type RequestState = typeof RequestState.Type

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
  hiddenMessagesIds: HashSet.empty(),
  tradeChecklist: {
    ...createEmptyTradeChecklistInState(),
  },
  feedbackSubmitted: false,
  messages: [],
}
