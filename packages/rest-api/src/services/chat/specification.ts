import {Schema} from '@effect/schema'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
} from '../contact/contracts'
import {
  ApproveRequestRequestE,
  ApproveRequestResponseE,
  BlockInboxRequestE,
  BlockInboxResponseE,
  CancelApprovalRequestE,
  CancelApprovalResponseE,
  CreateChallengeRequestE,
  CreateChallengeResponseE,
  CreateChallengesRequestE,
  CreateChallengesResponseE,
  CreateInboxRequestE,
  CreateInboxResponseE,
  DeleteInboxesRequestE,
  DeleteInboxesResponseE,
  DeleteInboxRequestE,
  DeleteInboxResponseE,
  DeletePulledMessagesRequestE,
  DeletePulledMessagesResponseE,
  InvalidChallengeError,
  LeaveChatRequestE,
  LeaveChatResponseE,
  ReceiverOfferInboxDoesNotExistError,
  RequestApprovalRequestE,
  RequestApprovalResponseE,
  RequestCancelledError,
  RequestMessagingNotAllowedError,
  RequestNotFoundError,
  RequestNotPendingError,
  RetrieveMessagesRequestE,
  RetrieveMessagesResponseE,
  SenderUserInboxDoesNotExistError,
  SendMessageRequestE,
  SendMessageResponseE,
  SendMessagesRequestE,
  SendMessagesResponseE,
  UpdateInboxRequestE,
  UpdateInboxResponseE,
} from './contracts'

export const UpdateInboxEndpoint = Api.put('updateInbox', '/api/v1/inboxes', {
  deprecated: true,
  description:
    'Not needed anymore since chat service does not sent fcm messages and does not collect fcm tokens anymore',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(UpdateInboxRequestE),
  Api.setResponseBody(UpdateInboxResponseE)
)

export const CreateInboxEndpoint = Api.post(
  'createInbox',
  '/api/v1/inboxes'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateInboxRequestE),
  Api.setRequestHeaders(CommonHeaders),
  Api.setResponseBody(CreateInboxResponseE)
)

export const DeleteInboxErrors = Schema.Union(
  InvalidChallengeError,
  InboxDoesNotExistError
)
export type DeleteInboxErrors = Schema.Schema.Type<typeof DeleteInboxErrors>

export const DeleteInboxEndpoint = Api.delete(
  'deleteInbox',
  '/api/v1/inboxes'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxRequestE),
  Api.setResponseBody(DeleteInboxResponseE),
  Api.addResponse({
    status: 400,
    body: DeleteInboxErrors,
  })
)

export const DeletePulledMessagesErrors = Schema.Union(
  InboxDoesNotExistError,
  InvalidChallengeError
)
export type DeletePulledMessagesErrors = Schema.Schema.Type<
  typeof DeletePulledMessagesErrors
>

export const DeletePulledMessagesEndpoint = Api.delete(
  'deletePulledMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeletePulledMessagesRequestE),
  Api.setResponseBody(DeletePulledMessagesResponseE),
  Api.addResponse({
    status: 400,
    body: DeletePulledMessagesErrors,
  })
)

export const BlockInboxErrors = Schema.Union(
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
  InvalidChallengeError
)
export type BlockInboxErrors = Schema.Schema.Type<typeof BlockInboxErrors>

export const BlockInboxEndpoint = Api.put(
  'blockInboxEndpoint',
  '/api/v1/inboxes/block'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(BlockInboxRequestE),
  Api.setResponseBody(BlockInboxResponseE),
  Api.addResponse({
    status: 400,
    body: BlockInboxErrors,
  })
)

export const RequestApprovalErrors = Schema.Union(
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
  RequestMessagingNotAllowedError
)

export const RequestApprovalEndpoint = Api.post(
  'requestApproval',
  '/api/v1/inboxes/approval/request'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(RequestApprovalRequestE),
  Api.setResponseBody(RequestApprovalResponseE),
  Api.addResponse({
    status: 400,
    body: RequestApprovalErrors,
  })
)

export const CancelRequestApprovalErrors = Schema.Union(
  RequestNotFoundError,
  RequestNotPendingError,
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
  InvalidChallengeError
)
export type CancelRequestApprovalErrors = Schema.Schema.Type<
  typeof CancelRequestApprovalErrors
>

export const CancelRequestApprovalEndpoint = Api.post(
  'cancelRequestApproval',
  '/api/v1/inboxes/approval/cancel'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CancelApprovalRequestE),
  Api.setResponseBody(CancelApprovalResponseE),
  Api.addResponse({
    status: 400,
    body: CancelRequestApprovalErrors,
  })
)

export const ApproveRequestErrors = Schema.Union(
  InvalidChallengeError,
  RequestCancelledError,
  RequestNotFoundError,
  RequestNotPendingError,
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError
)
export type ApproveRequestErrors = Schema.Schema.Type<
  typeof ApproveRequestErrors
>

export const ApproveRequestEndpoint = Api.post(
  'approveRequest',
  '/api/v1/inboxes/approval/confirm'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(ApproveRequestRequestE),
  Api.setResponseBody(ApproveRequestResponseE),
  Api.addResponse({
    status: 400,
    body: ApproveRequestErrors,
  })
)

export const DeleteInboxesEndpoint = Api.delete(
  'deleteInboxes',
  '/api/v1/inboxes/batch'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxesRequestE),
  Api.setResponseBody(DeleteInboxesResponseE)
)

export const LeaveChatErrors = Schema.Union(
  InvalidChallengeError,
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError
)

export const LeaveChatEndpoint = Api.post(
  'leaveChat',
  '/api/v1/inboxes/leave-chat'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),

  Api.setRequestBody(LeaveChatRequestE),
  Api.setResponseBody(LeaveChatResponseE),
  Api.addResponse({
    status: 400,
    body: LeaveChatErrors,
  })
)

export const RetrieveMessagesErrors = Schema.Union(
  InboxDoesNotExistError,
  InvalidChallengeError
)

export const RetrieveMessagesEndpoint = Api.put(
  'retrieveMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),

  Api.setRequestBody(RetrieveMessagesRequestE),
  Api.setResponseBody(RetrieveMessagesResponseE),
  Api.addResponse({
    status: 400,
    body: RetrieveMessagesErrors,
  })
)

export const SendMessageErrors = Schema.Union(
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
  InvalidChallengeError
)

export const SendMessageEndpoint = Api.post(
  'sendMessage',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SendMessageRequestE),
  Api.setResponseBody(SendMessageResponseE),
  Api.addResponse({
    status: 400,
    body: SendMessageErrors,
  })
)

export const SendMessagesEndpoint = Api.post(
  'sendMessages',
  '/api/v1/inboxes/messages/batch',
  {
    deprecated: true,
  }
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SendMessagesRequestE),
  Api.setResponseBody(SendMessagesResponseE)
)

export const CreateChallengeEndpoint = Api.post(
  'createChallenge',
  '/api/v1/challenges'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengeRequestE),
  Api.setResponseBody(CreateChallengeResponseE)
)

export const CreateChallengeBatchEndpoint = Api.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengesRequestE),
  Api.setResponseBody(CreateChallengesResponseE)
)

const InboxesApiGroup = ApiGroup.make('Inboxes').pipe(
  ApiGroup.addEndpoint(UpdateInboxEndpoint),
  ApiGroup.addEndpoint(CreateInboxEndpoint),
  ApiGroup.addEndpoint(DeleteInboxEndpoint),
  ApiGroup.addEndpoint(BlockInboxEndpoint),
  ApiGroup.addEndpoint(RequestApprovalEndpoint),
  ApiGroup.addEndpoint(CancelRequestApprovalEndpoint),
  ApiGroup.addEndpoint(ApproveRequestEndpoint),
  ApiGroup.addEndpoint(DeleteInboxesEndpoint),
  ApiGroup.addEndpoint(LeaveChatEndpoint),
  ApiGroup.addEndpoint(DeletePulledMessagesEndpoint)
)

const MessagesApiGroup = ApiGroup.make('Messages').pipe(
  ApiGroup.addEndpoint(RetrieveMessagesEndpoint),
  ApiGroup.addEndpoint(SendMessageEndpoint),
  ApiGroup.addEndpoint(SendMessagesEndpoint)
)

const ChallengeApiGroup = ApiGroup.make('Challenges').pipe(
  ApiGroup.addEndpoint(CreateChallengeEndpoint),
  ApiGroup.addEndpoint(CreateChallengeBatchEndpoint)
)

export const ChatApiSpecification = Api.make({
  title: 'Chat service',
  version: '1.0.0',
}).pipe(
  Api.addGroup(InboxesApiGroup),
  Api.addGroup(MessagesApiGroup),
  Api.addGroup(ChallengeApiGroup)
)
