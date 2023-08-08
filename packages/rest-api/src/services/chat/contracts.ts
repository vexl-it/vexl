import {z} from 'zod'
import {IdNumeric} from '@vexl-next/domain/dist/utility/IdNumeric'
import {
  MessageType,
  MessageTypeBackwardCompatible,
} from '@vexl-next/domain/dist/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'

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

export const SignedChallenge = z.object({
  challenge: z.string(),
  signature: z.string(),
})
export type SignedChallenge = z.TypeOf<typeof SignedChallenge>

export const ServerMessage = z.object({
  message: z.string(),
  senderPublicKey: PublicKeyPemBase64,
  messageType: MessageType,
})
export type ServerMessage = z.TypeOf<typeof ServerMessage>

export const ServerMessageWithId = ServerMessage.extend({
  id: IdNumeric,
})
export type ServerMessageWithId = z.TypeOf<typeof ServerMessageWithId>

const RequestBaseWithChallenge = z.object({
  keyPair: PrivateKeyHolder,
})

export const UpdateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
})
export type UpdateInboxRequest = z.TypeOf<typeof UpdateInboxRequest>

export const UpdateInboxResponse = z.object({
  firebaseToken: z.string().optional(),
})
export type UpdateInboxResponse = z.TypeOf<typeof UpdateInboxResponse>

export const CreateInboxRequest = RequestBaseWithChallenge.extend({
  token: z.string().optional(),
})
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
})
export type BlockInboxRequest = z.TypeOf<typeof BlockInboxRequest>

export const BlockInboxResponse = NoContentResponse
export type BlockInboxResponse = z.TypeOf<typeof BlockInboxResponse>

export const RequestApprovalRequest = z.object({
  publicKey: PublicKeyPemBase64,
  message: z.string(),
})
export type RequestApprovalRequest = z.TypeOf<typeof RequestApprovalRequest>

export const RequestApprovalResponse = ServerMessageWithId.extend({})
export type RequestApprovalResponse = z.TypeOf<typeof RequestApprovalResponse>

export const CancelApprovalRequest = z.object({
  publicKey: PublicKeyPemBase64,
  message: z.string(),
})
export type CancelApprovalRequest = z.TypeOf<typeof CancelApprovalRequest>

export const CancelApprovalResponse = ServerMessageWithId.extend({})
export type CancelApprovalResponse = z.TypeOf<typeof CancelApprovalResponse>

export const ApproveRequestRequest = RequestBaseWithChallenge.extend({
  publicKeyToConfirm: PublicKeyPemBase64,
  message: z.string(),
  approve: z.boolean(),
})
export type ApproveRequestRequest = z.TypeOf<typeof ApproveRequestRequest>

export const ApproveRequestResponse = ServerMessageWithId.extend({})
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
  messageType: MessageTypeBackwardCompatible,
})
export type SendMessageRequest = z.TypeOf<typeof SendMessageRequest>

export const SendMessageResponse = ServerMessageWithId.extend({})
export type SendMessageResponse = z.TypeOf<typeof SendMessageResponse>

export const LeaveChatRequest = z.object({
  keyPair: PrivateKeyHolder,
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
})
export type LeaveChatRequest = z.TypeOf<typeof LeaveChatRequest>

export const LeaveChatResponse = ServerMessageWithId.extend({})
export type LeaveChatResponse = z.TypeOf<typeof LeaveChatResponse>

export const MessageInBatch = z.object({
  receiverPublicKey: PublicKeyPemBase64,
  message: z.string(),
  messageType: MessageTypeBackwardCompatible,
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

export const SendMessagesResponse = z.array(ServerMessageWithId)
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
