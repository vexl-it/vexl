import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  MessageTypeE,
  ServerMessageE,
} from '@vexl-next/domain/src/general/messaging'
import {IdNumericE} from '@vexl-next/domain/src/utility/IdNumeric'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {
  Challenge,
  InvalidChallengeError,
  RequestBaseWithChallenge,
  SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {Schema} from 'effect'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  ForbiddenMessageTypeError,
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
} from '../contact/contracts'

export const NotificationServiceReadyQueryParams = Schema.Struct({
  notificationServiceReady: BooleanFromString,
})

export class RequestCancelledError extends Schema.TaggedError<RequestCancelledError>(
  'RequestCancelledError'
)('RequestCancelledError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100106'), {
    default: () => '100106',
  }),
}) {}

export class RequestNotFoundError extends Schema.TaggedError<RequestNotFoundError>(
  'RequestNotFoundError'
)('RequestNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100104'), {
    default: () => '100104',
  }),
}) {}

export class RequestNotPendingError extends Schema.TaggedError<RequestNotPendingError>(
  'RequestNotPendingError'
)('RequestNotPendingError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100153'), {
    default: () => '100153',
  }),
}) {}

export class ReceiverInboxDoesNotExistError extends Schema.TaggedError<ReceiverInboxDoesNotExistError>(
  'ReceiverInboxDoesNotExistError'
)('ReceiverInboxDoesNotExistError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100101'), {
    default: () => '100101',
  }),
}) {}

export class SenderInboxDoesNotExistError extends Schema.TaggedError<SenderInboxDoesNotExistError>(
  'SenderInboxDoesNotExistError'
)('SenderInboxDoesNotExistError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100107'), {
    default: () => '100107',
  }),
}) {}

export class RequestMessagingNotAllowedError extends Schema.TaggedError<RequestMessagingNotAllowedError>(
  'RequestMessagingNotAllowedError'
)('RequestMessagingNotAllowedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const ServerMessageWithId = Schema.Struct({
  ...ServerMessageE.fields,
  id: IdNumericE,
})
export type ServerMessageWithId = Schema.Schema.Type<typeof ServerMessageWithId>

export const UpdateInboxRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  token: Schema.optional(Schema.String),
})
export type UpdateInboxRequest = Schema.Schema.Type<typeof UpdateInboxRequest>

export const UpdateInboxResponse = Schema.Struct({
  firebaseToken: Schema.optional(Schema.String),
})
export type UpdateInboxResponse = Schema.Schema.Type<typeof UpdateInboxResponse>

export const CreateInboxRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  token: Schema.optional(Schema.String),
})
export type CreateInboxRequest = Schema.Schema.Type<typeof CreateInboxRequest>

export const CreateInboxResponse = NoContentResponse
export type CreateInboxResponse = Schema.Schema.Type<typeof CreateInboxResponse>

export const DeleteInboxErrors = Schema.Union(
  InvalidChallengeError,
  InboxDoesNotExistError
)
export type DeleteInboxErrors = Schema.Schema.Type<typeof DeleteInboxErrors>

export const DeleteInboxRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
})
export type DeleteInboxRequest = Schema.Schema.Type<typeof DeleteInboxRequest>

export const DeleteInboxResponse = NoContentResponse
export type DeleteInboxResponse = Schema.Schema.Type<typeof DeleteInboxResponse>

export const DeletePulledMessagesErrors = Schema.Union(
  InboxDoesNotExistError,
  InvalidChallengeError
)
export type DeletePulledMessagesErrors = typeof DeletePulledMessagesErrors.Type

export const DeletePulledMessagesRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
})
export type DeletePulledMessagesRequest =
  typeof DeletePulledMessagesRequest.Type

export const DeletePulledMessagesResponse = NoContentResponse
export type DeletePulledMessagesResponse =
  typeof DeletePulledMessagesResponse.Type

export const BlockInboxErrors = Schema.Union(
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  InvalidChallengeError
)
export type BlockInboxErrors = Schema.Schema.Type<typeof BlockInboxErrors>

export const BlockInboxRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  publicKeyToBlock: PublicKeyPemBase64E,
  // block: Schema.Boolean, // not used inside the app
})
export type BlockInboxRequest = Schema.Schema.Type<typeof BlockInboxRequest>

export const BlockInboxResponse = NoContentResponse
export type BlockInboxResponse = Schema.Schema.Type<typeof BlockInboxResponse>

export const RequestApprovalErrors = Schema.Union(
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  RequestMessagingNotAllowedError
)

export const RequestApprovalRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  message: Schema.String,
})
export type RequestApprovalRequest = typeof RequestApprovalRequest.Type

export const RequestApprovalResponse = Schema.Struct({
  ...ServerMessageWithId.fields,
  notificationHandled: Schema.Boolean,
})
export type RequestApprovalResponse = typeof RequestApprovalResponse.Type

export const CancelRequestApprovalErrors = Schema.Union(
  RequestNotPendingError,
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  InvalidChallengeError
)
export type CancelRequestApprovalErrors =
  typeof CancelRequestApprovalErrors.Type

export const CancelApprovalRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  message: Schema.String,
})
export type CancelApprovalRequest = typeof CancelApprovalRequest.Type

export const CancelApprovalResponse = Schema.Struct({
  ...ServerMessageWithId.fields,
  notificationHandled: Schema.Boolean,
})
export type CancelApprovalResponse = typeof CancelApprovalResponse.Type

export const ApproveRequestErrors = Schema.Union(
  InvalidChallengeError,
  RequestCancelledError,
  RequestNotFoundError,
  RequestNotPendingError,
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError
)
export type ApproveRequestErrors = typeof ApproveRequestErrors.Type

export const ApproveRequestRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  publicKeyToConfirm: PublicKeyPemBase64E,
  message: Schema.String,
  approve: Schema.Boolean,
})
export type ApproveRequestRequest = typeof ApproveRequestRequest.Type

export const ApproveRequestResponse = Schema.Struct({
  ...ServerMessageWithId.fields,
  notificationHandled: Schema.Boolean,
})
export type ApproveRequestResponse = typeof ApproveRequestResponse.Type

export const DeleteInboxesRequest = Schema.Struct({
  dataForRemoval: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
      signedChallenge: SignedChallenge,
    })
  ),
})
export type DeleteInboxesRequest = typeof DeleteInboxesRequest.Type

export const DeleteInboxesResponse = NoContentResponse
export type DeleteInboxesResponse = typeof DeleteInboxesResponse.Type

export const RetrieveMessagesErrors = Schema.Union(
  InboxDoesNotExistError,
  InvalidChallengeError
)

export const RetrieveMessagesRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
})
export type RetrieveMessagesRequest = typeof RetrieveMessagesRequest.Type

export const RetrieveMessagesResponse = Schema.Struct({
  messages: Schema.Array(ServerMessageWithId),
})
export type RetrieveMessagesResponse = typeof RetrieveMessagesResponse.Type

export const SendMessageRequest = Schema.Struct({
  signedChallenge: SignedChallenge,
  senderPublicKey: PublicKeyPemBase64E,
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
  messageType: MessageTypeE,
  messagePreview: Schema.optional(Schema.String),
})
export type SendMessageRequest = Schema.Schema.Type<typeof SendMessageRequest>

export const SendMessageResponse = Schema.Struct({
  ...ServerMessageWithId.fields,
  notificationHandled: Schema.Boolean,
})
export type SendMessageResponse = Schema.Schema.Type<typeof SendMessageResponse>

export const LeaveChatErrors = Schema.Union(
  InvalidChallengeError,
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError
)

export const LeaveChatRequest = Schema.Struct({
  senderPublicKey: PublicKeyPemBase64E,
  signedChallenge: SignedChallenge,
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
})
export type LeaveChatRequest = Schema.Schema.Type<typeof LeaveChatRequest>

export const LeaveChatResponse = Schema.Struct({
  ...ServerMessageWithId.fields,
  notificationHandled: Schema.Boolean,
})
export type LeaveChatResponse = Schema.Schema.Type<typeof LeaveChatResponse>

export const MessageInBatch = Schema.Struct({
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
  messageType: MessageTypeE,
  messagePreview: Schema.optional(Schema.String),
})
export type MessageInBatch = Schema.Schema.Type<typeof MessageInBatch>

export const InboxInBatch = Schema.Struct({
  senderPublicKey: PublicKeyPemBase64E,
  messages: Schema.Array(MessageInBatch),
  signedChallenge: SignedChallenge,
})
export type InboxInBatch = Schema.Schema.Type<typeof InboxInBatch>

export const SendMessageErrors = Schema.Union(
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
  ForbiddenMessageTypeError,
  InvalidChallengeError
)

export const SendMessagesRequest = Schema.Struct({
  data: Schema.Array(InboxInBatch),
})
export type SendMessagesRequest = Schema.Schema.Type<typeof SendMessagesRequest>

export const SendMessagesResponse = Schema.Array(
  Schema.Struct({
    ...ServerMessageWithId.fields,
    notificationHandled: Schema.Boolean,
  })
)
export type SendMessagesResponse = typeof SendMessagesResponse.Type

export const CreateChallengeRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})
export type CreateChallengeRequest = typeof CreateChallengeRequest.Type

export const CreateChallengeResponse = Schema.Struct({
  challenge: Challenge,
  expiration: UnixMillisecondsE,
})
export type CreateChallengeResponse = typeof CreateChallengeResponse.Type

export const CreateChallengesRequest = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type CreateChallengesRequest = typeof CreateChallengesRequest.Type

export const CreateChallengesResponse = Schema.Struct({
  challenges: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
      challenge: Challenge,
    })
  ),
  expiration: UnixMillisecondsE,
})
export type CreateChallengesResponse = typeof CreateChallengeResponse.Type
