import {z} from 'zod'
import {IdNumeric} from '@vexl-next/domain/dist/utility/IdNumeric'
import {MessageType} from '@vexl-next/domain/dist/general/Inbox.brand'

export const SignedChallenge = z.object({
  challenge: z.string(),
  signature: z.string(),
})
export type SignedChallenge = z.TypeOf<typeof SignedChallenge>

export const Message = z.object({
  message: z.string(),
  senderPublicKey: z.string(),
  messageType: MessageType,
})

export const MessageWithId = Message.extend({
  id: IdNumeric,
})
export type MessageWithId = z.TypeOf<typeof MessageWithId>

const RequestBase = z.object({
  publicKey: z.string(),
  signedChallenge: SignedChallenge,
})

export const UpdateInboxRequest = RequestBase.extend({
  token: z.string().optional(),
})
export type UpdateInboxRequest = z.TypeOf<typeof UpdateInboxRequest>

export const UpdateInboxResponse = z.object({
  firebaseToken: z.string().optional(),
})
export type UpdateInboxResponse = z.TypeOf<typeof UpdateInboxResponse>

export const CreateInboxRequest = RequestBase.extend({
  token: z.string().optional(),
})
export type CreateInboxRequest = z.TypeOf<typeof CreateInboxRequest>

export const CreateInboxResponse = z.void()
export type CreateInboxResponse = z.TypeOf<typeof CreateInboxResponse>

export const DeleteInboxRequest = RequestBase.extend({})
export type DeleteInboxRequest = z.TypeOf<typeof DeleteInboxRequest>

export const DeleteInboxResponse = z.void()
export type DeleteInboxResponse = z.TypeOf<typeof DeleteInboxResponse>

export const DeletePulledMessagesRequest = RequestBase.extend({})
export type DeletePulledMessagesRequest = z.TypeOf<
  typeof DeletePulledMessagesRequest
>

export const DeletePulledMessagesResponse = z.void()
export type DeletePulledMessagesResponse = z.TypeOf<
  typeof DeletePulledMessagesResponse
>

export const BlockInboxRequest = RequestBase.extend({
  publicKeyToBlock: z.string(),
  block: z.boolean(),
})
export type BlockInboxRequest = z.TypeOf<typeof BlockInboxRequest>

export const BlockInboxResponse = z.void()
export type BlockInboxResponse = z.TypeOf<typeof BlockInboxResponse>

export const RequestApprovalRequest = z.object({
  publicKey: z.string(),
  message: z.string(),
})
export type RequestApprovalRequest = z.TypeOf<typeof RequestApprovalRequest>

export const RequestApprovalResponse = MessageWithId.extend({})
export type RequestApprovalResponse = z.TypeOf<typeof RequestApprovalResponse>

export const ApproveRequestRequest = RequestBase.extend({
  publicKeyToConfirm: z.string(),
  message: z.string(),
  approve: z.boolean(),
})
export type ApproveRequestRequest = z.TypeOf<typeof ApproveRequestRequest>

export const ApproveRequestResponse = MessageWithId.extend({})
export type ApproveRequestResponse = z.TypeOf<typeof ApproveRequestResponse>

export const DeleteInboxesRequest = z.object({
  dataForRemoval: z.array(
    z.object({
      publicKey: z.string(),
      signedChallenge: SignedChallenge,
    })
  ),
})
export type DeleteInboxesRequest = z.TypeOf<typeof DeleteInboxesRequest>

export const DeleteInboxesResponse = z.void()
export type DeleteInboxesResponse = z.TypeOf<typeof DeleteInboxesResponse>

export const RetrieveMessagesRequest = RequestBase.extend({})
export type RetrieveMessagesRequest = z.TypeOf<typeof RetrieveMessagesRequest>

export const RetrieveMessagesResponse = z.object({
  messages: z.array(MessageWithId),
})
export type RetrieveMessagesResponse = z.TypeOf<typeof RetrieveMessagesResponse>

export const SendMessageRequest = MessageWithId.extend({
  receiverPublicKey: z.string(),
  signedChallenge: SignedChallenge,
})
export type SendMessageRequest = z.TypeOf<typeof SendMessageRequest>

export const SendMessageResponse = MessageWithId.extend({})
export type SendMessageResponse = z.TypeOf<typeof SendMessageResponse>

export const SendMessagesRequest = z.object({
  data: z.array(
    z.object({
      senderPublicKey: z.string(),
      messages: z.array(Message),
      signedChallenge: SignedChallenge,
    })
  ),
})
export type SendMessagesRequest = z.TypeOf<typeof SendMessagesRequest>

export const SendMessagesResponse = z.array(MessageWithId)
export type SendMessagesResponse = z.TypeOf<typeof SendMessagesResponse>

export const CreateChallengeRequest = z.object({
  publicKey: z.string(),
})
export type CreateChallengeRequest = z.TypeOf<typeof CreateChallengeRequest>
export const CreateChallengeResponse = z.object({
  challenge: z.string(),
  expiration: z.string().datetime({offset: true}),
})
export type CreateChallengeResponse = z.TypeOf<typeof CreateChallengeResponse>

export const CreateChallengesRequest = z.object({
  publicKeys: z.array(z.string()),
})
export type CreateChallengesRequest = z.TypeOf<typeof CreateChallengesRequest>

export const CreateChallengesResponse = z.object({
  challenges: z.array(
    z.object({
      publicKey: z.string(),
      challenge: z.string(),
    })
  ),
  expiration: z.string().datetime({offset: true}),
})
export type CreateChallengesResponse = z.TypeOf<typeof CreateChallengesResponse>

export const ExportMyDataRequest = z.void()
export type ExportMyDataRequest = z.TypeOf<typeof ExportMyDataRequest>

export const ExportMyDataResponse = z.object({pdfFile: z.string()})
export type ExportMyDataResponse = z.TypeOf<typeof ExportMyDataResponse>
