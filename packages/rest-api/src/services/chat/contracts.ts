import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  MessageType,
  ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {IdNumeric} from '@vexl-next/domain/src/utility/IdNumeric'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {z} from 'zod'
import {NoContentResponse} from '../../NoContentResponse.brand'

export interface RequestCancelledError {
  readonly _tag: 'RequestCancelledError'
}

export interface RequestNotFoundError {
  readonly _tag: 'RequestNotFoundError'
}

export interface RequestAlreadyApprovedError {
  readonly _tag: 'RequestAlreadyApprovedError'
}

export interface OtherSideAccountDeleted {
  readonly _tag: 'OtherSideAccountDeleted'
}

export interface ReceiverOfferInboxDoesNotExistError {
  readonly _tag: 'ReceiverOfferInboxDoesNotExistError'
}

export interface SenderUserInboxDoesNotExistError {
  readonly _tag: 'SenderUserInboxDoesNotExistError'
}

export const SignedChallenge = z
  .object({
    challenge: z.string(),
    signature: z.string(),
  })
  .readonly()
export type SignedChallenge = z.TypeOf<typeof SignedChallenge>

export const ServerMessageWithId = ServerMessage.extend({
  id: IdNumeric,
})
export type ServerMessageWithId = z.TypeOf<typeof ServerMessageWithId>

const RequestBaseWithChallenge = z.object({
  keyPair: PrivateKeyHolder,
})

export const UpdateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
}).readonly()
export type UpdateInboxRequest = z.TypeOf<typeof UpdateInboxRequest>

export const UpdateInboxResponse = z
  .object({
    firebaseToken: z.string().optional(),
  })
  .readonly()
export type UpdateInboxResponse = z.TypeOf<typeof UpdateInboxResponse>

export const CreateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
}).readonly()
export type CreateInboxRequest = z.TypeOf<typeof CreateInboxRequest>

export const CreateInboxResponse = NoContentResponse
export type CreateInboxResponse = z.TypeOf<typeof CreateInboxResponse>

export const DeleteInboxRequest = RequestBaseWithChallenge.extend({})
export type DeleteInboxRequest = z.TypeOf<typeof DeleteInboxRequest>

export const DeleteInboxResponse = NoContentResponse
export type DeleteInboxResponse = z.TypeOf<typeof DeleteInboxResponse>

export const DeletePulledMessagesRequest = RequestBaseWithChallenge.extend({})
export type DeletePulledMessagesRequest = z.TypeOf<
  typeof DeletePulledMessagesRequest
>

export const DeletePulledMessagesResponse = NoContentResponse
export type DeletePulledMessagesResponse = z.TypeOf<
  typeof DeletePulledMessagesResponse
>

export const BlockInboxRequest = RequestBaseWithChallenge.extend({
  publicKeyToBlock: PublicKeyPemBase64,
  block: z.boolean(),
}).readonly()
export type BlockInboxRequest = z.TypeOf<typeof BlockInboxRequest>

export const BlockInboxResponse = NoContentResponse
export type BlockInboxResponse = z.TypeOf<typeof BlockInboxResponse>

export const RequestApprovalRequest = z
  .object({
    publicKey: PublicKeyPemBase64,
    message: z.string(),
    notificationServiceReady: z.boolean(),
  })
  .readonly()
export type RequestApprovalRequest = z.TypeOf<typeof RequestApprovalRequest>

export const RequestApprovalResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export type RequestApprovalResponse = z.TypeOf<typeof RequestApprovalResponse>

export const CancelApprovalRequest = z.object({
  publicKey: PublicKeyPemBase64,
  message: z.string(),
  notificationServiceReady: z.boolean(),
})
export type CancelApprovalRequest = z.TypeOf<typeof CancelApprovalRequest>

export const CancelApprovalResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export type CancelApprovalResponse = z.TypeOf<typeof CancelApprovalResponse>

export const ApproveRequestRequest = RequestBaseWithChallenge.extend({
  publicKeyToConfirm: PublicKeyPemBase64,
  message: z.string(),
  approve: z.boolean(),
  notificationServiceReady: z.boolean(),
})
export type ApproveRequestRequest = z.TypeOf<typeof ApproveRequestRequest>

export const ApproveRequestResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export type ApproveRequestResponse = z.TypeOf<typeof ApproveRequestResponse>

export const DeleteInboxesRequest = z.object({
  dataForRemoval: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      signedChallenge: SignedChallenge,
    })
  ),
})
export type DeleteInboxesRequest = z.TypeOf<typeof DeleteInboxesRequest>

export const DeleteInboxesResponse = NoContentResponse
export type DeleteInboxesResponse = z.TypeOf<typeof DeleteInboxesResponse>

export const RetrieveMessagesRequest = RequestBaseWithChallenge.extend({})
export type RetrieveMessagesRequest = z.TypeOf<typeof RetrieveMessagesRequest>

export const RetrieveMessagesResponse = z.object({
  messages: z.array(ServerMessageWithId),
})
export type RetrieveMessagesResponse = z.TypeOf<typeof RetrieveMessagesResponse>

export const SendMessageRequest = z.object({
  keyPair: PrivateKeyHolder,
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  messageType: MessageType,
  messagePreview: z.string().optional(),
  notificationServiceReady: z.boolean(),
})
export type SendMessageRequest = z.TypeOf<typeof SendMessageRequest>

export const SendMessageResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export type SendMessageResponse = z.TypeOf<typeof SendMessageResponse>

export const LeaveChatRequest = z.object({
  keyPair: PrivateKeyHolder,
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  notificationServiceReady: z.boolean(),
})
export type LeaveChatRequest = z.TypeOf<typeof LeaveChatRequest>

export const LeaveChatResponse = ServerMessageWithId.extend({
  notificationHandled: z.boolean(),
})
export type LeaveChatResponse = z.TypeOf<typeof LeaveChatResponse>

export const MessageInBatch = z.object({
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  messageType: MessageType,
  messagePreview: z.string().optional(),
})
export type MessageInBatch = z.TypeOf<typeof MessageInBatch>

export const InboxInBatch = z.object({
  senderPublicKey: PublicKeyPemBase64,
  messages: z.array(MessageInBatch),
  signedChallenge: SignedChallenge,
})
export type InboxInBatch = z.TypeOf<typeof InboxInBatch>

export const SendMessagesRequest = z.object({
  data: z.array(InboxInBatch),
})
export type SendMessagesRequest = z.TypeOf<typeof SendMessagesRequest>

export const SendMessagesResponse = z.array(
  ServerMessageWithId.extend({
    notificationHandled: z.boolean(),
  })
)
export type SendMessagesResponse = z.TypeOf<typeof SendMessagesResponse>

export const CreateChallengeRequest = z.object({
  publicKey: PublicKeyPemBase64,
})
export type CreateChallengeRequest = z.TypeOf<typeof CreateChallengeRequest>
export const CreateChallengeResponse = z.object({
  challenge: z.string(),
  expiration: UnixMilliseconds,
})
export type CreateChallengeResponse = z.TypeOf<typeof CreateChallengeResponse>

export const CreateChallengesRequest = z.object({
  publicKeys: z.array(PublicKeyPemBase64),
})
export type CreateChallengesRequest = z.TypeOf<typeof CreateChallengesRequest>

export const CreateChallengesResponse = z.object({
  challenges: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      challenge: z.string(),
    })
  ),
  expiration: UnixMilliseconds,
})
export type CreateChallengesResponse = z.TypeOf<typeof CreateChallengesResponse>

export const ExportMyDataRequest = z.any()
export type ExportMyDataRequest = z.TypeOf<typeof ExportMyDataRequest>

export const ExportMyDataResponse = z.object({pdfFile: z.string()})
export type ExportMyDataResponse = z.TypeOf<typeof ExportMyDataResponse>
