import {Schema} from '@effect/schema'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
} from '../contact/contracts'
import {
  BlockInboxRequestE,
  BlockInboxResponseE,
  CancelApprovalResponseE,
  CreateChallengeRequestE,
  CreateChallengeResponseE,
  CreateInboxRequestE,
  DeleteInboxRequestE,
  DeleteInboxResponseE,
  LeaveChatRequestE,
  LeaveChatResponseE,
  NotificationServiceReadyQueryParams,
  OtherSideAccountDeleted,
  ReceiverOfferInboxDoesNotExistError,
  RequestAlreadyApprovedError,
  RequestApprovalRequestE,
  RequestApprovalResponseE,
  RequestCancelledError,
  RequestNotFoundError,
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

export const UpdateInboxEndpoint = Api.put(
  'updateInbox',
  '/api/v1/inboxes'
).pipe(
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
  Api.setResponseBody(UpdateInboxResponseE)
)

export const DeleteInboxEndpoint = Api.delete(
  'deleteInbox',
  '/api/v1/inboxes'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxRequestE),
  Api.setResponseBody(DeleteInboxResponseE)
)

export const DeletePulledMessagesEndpoint = Api.delete(
  'deletePulledMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxRequestE),
  Api.setResponseBody(DeleteInboxResponseE)
)

export const BlockInboxEndpoint = Api.put(
  'blockInboxEndpoint',
  '/api/v1/inboxes/block'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(BlockInboxRequestE),
  Api.setResponseBody(BlockInboxResponseE)
)

export const RequestApprovalErrors = Schema.Union(
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError
)

export const RequestApprovalEndpoint = Api.post(
  'requestApproval',
  '/api/v1/inboxes/approval/request'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
  Api.setRequestBody(RequestApprovalRequestE),
  Api.setResponseBody(RequestApprovalResponseE),
  Api.addResponse({
    status: 400,
    body: RequestApprovalErrors,
  })
)

const CancelRequestApprovalErrors = Schema.Union(
  RequestNotFoundError,
  RequestAlreadyApprovedError,
  OtherSideAccountDeleted
)

export const CancelRequestApprovalEndpoint = Api.post(
  'cancelRequestApproval',
  '/api/v1/inboxes/approval/cancel'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
  Api.setResponseBody(CancelApprovalResponseE),
  Api.addResponse({
    status: 400,
    body: CancelRequestApprovalErrors,
  })
)

const ApproveRequestErrors = Schema.Union(
  RequestCancelledError,
  RequestNotFoundError,
  RequestAlreadyApprovedError,
  OtherSideAccountDeleted
)

export const ApproveRequestEndpoint = Api.post(
  'approveRequest',
  '/api/v1/inboxes/approval/confirm'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
  Api.setRequestBody(RequestApprovalRequestE),
  Api.setResponseBody(CancelApprovalResponseE),
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
  Api.setRequestBody(DeleteInboxRequestE),
  Api.setResponseBody(DeleteInboxResponseE)
)

export const LeaveChatErrors = Schema.Union(
  NotPermittedToSendMessageToTargetInboxError,
  InboxDoesNotExistError
)

export const LeaveChatEndpoint = Api.post(
  'leaveChat',
  '/api/v1/inboxes/leave-chat'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
  Api.setRequestBody(LeaveChatRequestE),
  Api.setResponseBody(LeaveChatResponseE),
  Api.addResponse({
    status: 400,
    body: LeaveChatErrors,
  })
)

export const RetrieveMessagesErrors = Schema.Union(InboxDoesNotExistError)

export const RetrieveMessagesEndpoint = Api.put(
  'retrieveMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
  Api.setRequestBody(RetrieveMessagesRequestE),
  Api.setResponseBody(RetrieveMessagesResponseE),
  Api.addResponse({
    status: 400,
    body: RetrieveMessagesErrors,
  })
)

export const SendMessageErrors = Schema.Union(
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError
)

export const SendMessageEndpoint = Api.post(
  'sendMessage',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
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
  Api.setRequestQuery(NotificationServiceReadyQueryParams),
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
  Api.setRequestBody(CreateChallengeRequestE),
  Api.setResponseBody(CreateChallengeResponseE)
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
  ApiGroup.addEndpoint(LeaveChatEndpoint)
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
