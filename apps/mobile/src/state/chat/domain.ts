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
  ChatRecoveryProof,
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

// Rebuilt from the other side's HISTORY after a backup restore. The other side
// could have altered it, so it is shown above a "restored" divider.
const restored = Schema.optional(Schema.Boolean)

export const ReceivedMessage = Schema.Struct({
  state: Schema.Literal('received'),
  message: ChatMessage,
  receivedByServerAt: Schema.optional(UnixMilliseconds),
  restored,
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
  restored,
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
  // Recovered after a backup restore from a message of the other side. Kept
  // in `pendingRecoveryChats` until its history proves the other side is a
  // real chat partner, then counts as open until its history says otherwise.
  restoredFromBackup: Schema.optional(Schema.Boolean),
  // Local time the pending recovery started, see `isPendingRecoveryChatExpired`
  recoveryStartedAt: Schema.optional(UnixMilliseconds),
  // History is accepted once, and only messages from before the request
  historyRequestedAt: Schema.optional(UnixMilliseconds),
  historyMerged: Schema.optional(Schema.Boolean),
  // Sent back in HISTORY if the other side restores its account
  otherSideRecoveryProof: Schema.optional(ChatRecoveryProof),
})
export type ChatWithMessages = typeof ChatWithMessages.Type

export const InboxInState = Schema.Struct({
  inbox: Inbox,
  chats: Schema.Array(ChatWithMessages).pipe(Schema.mutable),
  // Registered by a backup restore: chats are recovered from the other side.
  restoredFromBackup: Schema.optional(Schema.Boolean),
  restoredAt: Schema.optional(UnixMilliseconds),
  // Chats recovered from senders not yet proven to be real chat partners.
  // Hidden from everything else until their history arrives.
  pendingRecoveryChats: Schema.optional(Schema.Array(ChatWithMessages)),
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
