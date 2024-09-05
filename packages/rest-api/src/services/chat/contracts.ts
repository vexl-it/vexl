import {Schema} from '@effect/schema'
import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyHolderE,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  MessageType,
  MessageTypeE,
  ServerMessage,
  ServerMessageE,
} from '@vexl-next/domain/src/general/messaging'
import {IdNumeric, IdNumericE} from '@vexl-next/domain/src/utility/IdNumeric'
import {
  UnixMilliseconds,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {z} from 'zod'
import {
  NoContentResponse,
  NoContentResponseE,
} from '../../NoContentResponse.brand'

export class RequestCancelledError extends Schema.TaggedError<RequestCancelledError>(
  'RequestCancelledError'
)('RequestCancelledError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class RequestNotFoundError extends Schema.TaggedError<RequestNotFoundError>(
  'RequestNotFoundError'
)('RequestNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class RequestAlreadyApprovedError extends Schema.TaggedError<RequestAlreadyApprovedError>(
  'RequestAlreadyApprovedError'
)('RequestAlreadyApprovedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class OtherSideAccountDeleted extends Schema.TaggedError<OtherSideAccountDeleted>(
  'OtherSideAccountDeleted'
)('OtherSideAccountDeleted', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class ReceiverOfferInboxDoesNotExistError extends Schema.TaggedError<ReceiverOfferInboxDoesNotExistError>(
  'ReceiverOfferInboxDoesNotExistError'
)('ReceiverOfferInboxDoesNotExistError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class SenderUserInboxDoesNotExistError extends Schema.TaggedError<SenderUserInboxDoesNotExistError>(
  'SenderUserInboxDoesNotExistError'
)('SenderUserInboxDoesNotExistError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const SignedChallenge = z
  .object({
    challenge: z.string(),
    signature: z.string(),
  })
  .readonly()

export const SignedChallengeE = Schema.Struct({
  challenge: Schema.String,
  signature: Schema.String,
})
export type SignedChallenge = Schema.Schema.Type<typeof SignedChallengeE>

export const ServerMessageWithId = ServerMessage.extend({
  id: IdNumeric,
})
export const ServerMessageWithIdE = Schema.Struct({
  ...ServerMessageE.fields,
  id: IdNumericE,
})
export type ServerMessageWithId = Schema.Schema.Type<
  typeof ServerMessageWithIdE
>

const RequestBaseWithChallenge = z.object({
  keyPair: PrivateKeyHolder,
})
const RequestBaseWithChallengeE = Schema.Struct({
  keyPair: PrivateKeyHolderE,
})

export const UpdateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
}).readonly()

export const UpdateInboxRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
  token: Schema.optional(Schema.String),
})
export type UpdateInboxRequest = Schema.Schema.Type<typeof UpdateInboxRequestE>

export const UpdateInboxResponse = z
  .object({
    firebaseToken: z.string().optional(),
  })
  .readonly()
export const UpdateInboxResponseE = Schema.Struct({
  firebaseToken: Schema.optional(Schema.String),
})
export type UpdateInboxResponse = Schema.Schema.Type<
  typeof UpdateInboxResponseE
>

export const CreateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
}).readonly()
export const CreateInboxRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
  token: Schema.optional(Schema.String),
})
export type CreateInboxRequest = Schema.Schema.Type<typeof CreateInboxRequestE>

export const CreateInboxResponse = NoContentResponse
export const CreateInboxResponseE = NoContentResponseE
export type CreateInboxResponse = Schema.Schema.Type<
  typeof CreateInboxResponseE
>

export const DeleteInboxRequest = RequestBaseWithChallenge.extend({})
export const DeleteInboxRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
})
export type DeleteInboxRequest = Schema.Schema.Type<typeof DeleteInboxRequestE>

export const DeleteInboxResponse = NoContentResponse
export const DeleteInboxResponseE = NoContentResponseE
export type DeleteInboxResponse = Schema.Schema.Type<
  typeof DeleteInboxResponseE
>

export const DeletePulledMessagesRequest = RequestBaseWithChallenge.extend({})
export const DeletePulledMessagesRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
})
export type DeletePulledMessagesRequest = Schema.Schema.Type<
  typeof DeletePulledMessagesRequestE
>

export const DeletePulledMessagesResponse = NoContentResponse
export const DeletePulledMessagesResponseE = NoContentResponseE
export type DeletePulledMessagesResponse = Schema.Schema.Type<
  typeof DeletePulledMessagesResponseE
>

export const BlockInboxRequest = RequestBaseWithChallenge.extend({
  publicKeyToBlock: PublicKeyPemBase64,
  block: z.boolean(),
}).readonly()
export const BlockInboxRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
  publicKeyToBlock: PublicKeyPemBase64E,
  block: Schema.Boolean,
})
export type BlockInboxRequest = Schema.Schema.Type<typeof BlockInboxRequestE>

export const BlockInboxResponse = NoContentResponse
export const BlockInboxResponseE = NoContentResponseE
export type BlockInboxResponse = Schema.Schema.Type<typeof BlockInboxResponseE>

export const RequestApprovalRequest = z
  .object({
    publicKey: PublicKeyPemBase64,
    message: z.string(),
    notificationServiceReady: z.boolean(),
  })
  .readonly()
export const RequestApprovalRequestE = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  message: Schema.String,
  notificationServiceReady: Schema.Boolean,
})
export type RequestApprovalRequest = Schema.Schema.Type<
  typeof RequestApprovalRequestE
>

export const RequestApprovalResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export const RequestApprovalResponseE = Schema.Struct({
  ...ServerMessageWithIdE.fields,
  notificationHandled: Schema.Boolean,
})
export type RequestApprovalResponse = Schema.Schema.Type<
  typeof RequestApprovalResponseE
>

export const CancelApprovalRequest = z.object({
  publicKey: PublicKeyPemBase64,
  message: z.string(),
  notificationServiceReady: z.boolean(),
})
export const CancelApprovalRequestE = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  message: Schema.String,
  notificationServiceReady: Schema.Boolean,
})
export type CancelApprovalRequest = Schema.Schema.Type<
  typeof CancelApprovalRequestE
>

export const CancelApprovalResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export const CancelApprovalResponseE = Schema.Struct({
  ...ServerMessageWithIdE.fields,
  notificationHandled: Schema.Boolean,
})
export type CancelApprovalResponse = Schema.Schema.Type<
  typeof CancelApprovalResponseE
>

export const ApproveRequestRequest = RequestBaseWithChallenge.extend({
  publicKeyToConfirm: PublicKeyPemBase64,
  message: z.string(),
  approve: z.boolean(),
  notificationServiceReady: z.boolean(),
})
export const ApproveRequestRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
  publicKeyToConfirm: PublicKeyPemBase64E,
  message: Schema.String,
  approve: Schema.Boolean,
  notificationServiceReady: Schema.Boolean,
})
export type ApproveRequestRequest = Schema.Schema.Type<
  typeof ApproveRequestRequestE
>

export const ApproveRequestResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export const ApproveRequestResponseE = Schema.Struct({
  ...ServerMessageWithIdE.fields,
  notificationHandled: Schema.Boolean,
})
export type ApproveRequestResponse = Schema.Schema.Type<
  typeof ApproveRequestResponseE
>

export const DeleteInboxesRequest = z.object({
  dataForRemoval: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      signedChallenge: SignedChallenge,
    })
  ),
})
export const DeleteInboxesRequestE = Schema.Struct({
  dataForRemoval: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
      signedChallenge: SignedChallengeE,
    })
  ),
})
export type DeleteInboxesRequest = Schema.Schema.Type<
  typeof DeleteInboxesRequestE
>

export const DeleteInboxesResponse = NoContentResponse
export const DeleteInboxesResponseE = NoContentResponseE
export type DeleteInboxesResponse = Schema.Schema.Type<
  typeof DeleteInboxesResponseE
>

export const RetrieveMessagesRequest = RequestBaseWithChallenge.extend({})
export const RetrieveMessagesRequestE = Schema.Struct({
  ...RequestBaseWithChallengeE.fields,
})
export type RetrieveMessagesRequest = Schema.Schema.Type<
  typeof RetrieveMessagesRequestE
>

export const RetrieveMessagesResponse = z.object({
  messages: z.array(ServerMessageWithId),
})
export const RetrieveMessagesResponseE = Schema.Struct({
  messages: Schema.Array(ServerMessageWithIdE),
})
export type RetrieveMessagesResponse = Schema.Schema.Type<
  typeof RetrieveMessagesResponseE
>

export const SendMessageRequest = z.object({
  keyPair: PrivateKeyHolder,
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  messageType: MessageType,
  messagePreview: z.string().optional(),
  notificationServiceReady: z.boolean(),
})
export const SendMessageRequestE = Schema.Struct({
  keyPair: PrivateKeyHolderE,
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
  messageType: MessageTypeE,
  messagePreview: Schema.optional(Schema.String),
  notificationServiceReady: Schema.Boolean,
})
export type SendMessageRequest = Schema.Schema.Type<typeof SendMessageRequestE>

export const SendMessageResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export const SendMessageResponseE = Schema.Struct({
  ...ServerMessageWithIdE.fields,
  notificationHandled: Schema.Boolean,
})
export type SendMessageResponse = Schema.Schema.Type<
  typeof SendMessageResponseE
>

export const LeaveChatRequest = z.object({
  keyPair: PrivateKeyHolder,
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  notificationServiceReady: z.boolean(),
})
export const LeaveChatRequestE = Schema.Struct({
  keyPair: PrivateKeyHolderE,
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
  notificationServiceReady: Schema.Boolean,
})
export type LeaveChatRequest = Schema.Schema.Type<typeof LeaveChatRequestE>

export const LeaveChatResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export const LeaveChatResponseE = Schema.Struct({
  ...ServerMessageWithIdE.fields,
  notificationHandled: Schema.Boolean,
})
export type LeaveChatResponse = Schema.Schema.Type<typeof LeaveChatResponseE>

export const MessageInBatch = z.object({
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  messageType: MessageType,
  messagePreview: z.string().optional(),
})
export const MessageInBatchE = Schema.Struct({
  receiverPublicKey: PublicKeyPemBase64E,
  message: Schema.String,
  messageType: MessageTypeE,
  messagePreview: Schema.optional(Schema.String),
})
export type MessageInBatch = Schema.Schema.Type<typeof MessageInBatchE>

export const InboxInBatch = z.object({
  senderPublicKey: PublicKeyPemBase64,
  messages: z.array(MessageInBatch),
  signedChallenge: SignedChallenge,
})
export const InboxInBatchE = Schema.Struct({
  senderPublicKey: PublicKeyPemBase64E,
  messages: Schema.Array(MessageInBatchE),
  signedChallenge: SignedChallengeE,
})
export type InboxInBatch = Schema.Schema.Type<typeof InboxInBatchE>

export const SendMessagesRequest = z.object({
  data: z.array(InboxInBatch),
})
export const SendMessagesRequestE = Schema.Struct({
  data: Schema.Array(InboxInBatchE),
})
export type SendMessagesRequest = Schema.Schema.Type<
  typeof SendMessagesRequestE
>

export const SendMessagesResponse = z.array(
  ServerMessageWithId.extend({
    notificationHandled: z.boolean(),
  })
)
export const SendMessagesResponseE = Schema.Array(
  Schema.Struct({
    ...ServerMessageWithIdE.fields,
    notificationHandled: Schema.Boolean,
  })
)
export type SendMessagesResponse = Schema.Schema.Type<
  typeof SendMessagesResponse
>

export const CreateChallengeRequest = z.object({
  publicKey: PublicKeyPemBase64,
})
export const CreateChallengeRequestE = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})
export type CreateChallengeRequest = Schema.Schema.Type<
  typeof CreateChallengeRequestE
>
export const CreateChallengeResponse = z.object({
  challenge: z.string(),
  expiration: UnixMilliseconds,
})
export const CreateChallengeResponseE = Schema.Struct({
  challenge: Schema.String,
  expiration: UnixMillisecondsE,
})
export type CreateChallengeResponse = Schema.Schema.Type<
  typeof CreateChallengeResponseE
>

export const CreateChallengesRequest = z.object({
  publicKeys: z.array(PublicKeyPemBase64),
})
export const CreateChallengesRequestE = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type CreateChallengesRequest = Schema.Schema.Type<
  typeof CreateChallengesRequestE
>

export const CreateChallengesResponse = z.object({
  challenges: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      challenge: z.string(),
    })
  ),
  expiration: UnixMilliseconds,
})
export const CreateChallengesResponseE = Schema.Struct({
  challenges: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
      challenge: Schema.String,
    })
  ),
  expiration: UnixMillisecondsE,
})
export type CreateChallengesResponse = Schema.Schema.Type<
  typeof CreateChallengeResponseE
>
