import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {
  ApproveRequestErrors,
  ApproveRequestRequest,
  ApproveRequestResponse,
  BlockInboxErrors,
  BlockInboxRequest,
  BlockInboxResponse,
  CancelApprovalRequest,
  CancelApprovalResponse,
  CancelRequestApprovalErrors,
  CreateChallengeRequest,
  CreateChallengeResponse,
  CreateChallengesRequest,
  CreateChallengesResponse,
  CreateInboxRequest,
  CreateInboxResponse,
  DeleteInboxErrors,
  DeleteInboxesRequest,
  DeleteInboxesResponse,
  DeleteInboxRequest,
  DeleteInboxResponse,
  DeletePulledMessagesErrors,
  DeletePulledMessagesRequest,
  DeletePulledMessagesResponse,
  LeaveChatErrors,
  LeaveChatRequest,
  LeaveChatResponse,
  RequestApprovalErrors,
  RequestApprovalRequest,
  RequestApprovalResponse,
  RetrieveMessagesErrors,
  RetrieveMessagesRequest,
  RetrieveMessagesResponse,
  SendMessageErrors,
  SendMessageRequest,
  SendMessageResponse,
  SendMessagesRequest,
  SendMessagesResponse,
  UpdateInboxRequest,
  UpdateInboxResponse,
} from './contracts'

export const UpdateInboxEndpoint = Api.put('updateInbox', '/api/v1/inboxes', {
  deprecated: true,
  description:
    'Not needed anymore since chat service does not sent fcm messages and does not collect fcm tokens anymore',
}).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(UpdateInboxRequest),
  Api.setResponseBody(UpdateInboxResponse)
)

export const CreateInboxEndpoint = Api.post(
  'createInbox',
  '/api/v1/inboxes'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateInboxRequest),
  Api.setRequestHeaders(CommonHeaders),
  Api.setResponseBody(CreateInboxResponse)
)

export const DeleteInboxEndpoint = Api.delete(
  'deleteInbox',
  '/api/v1/inboxes'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxRequest),
  Api.setResponseBody(DeleteInboxResponse),
  Api.addResponse({
    status: 400,
    body: DeleteInboxErrors,
  })
)

export const DeletePulledMessagesEndpoint = Api.delete(
  'deletePulledMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeletePulledMessagesRequest),
  Api.setResponseBody(DeletePulledMessagesResponse),
  Api.addResponse({
    status: 400,
    body: DeletePulledMessagesErrors,
  })
)

export const BlockInboxEndpoint = Api.put(
  'blockInbox',
  '/api/v1/inboxes/block'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(BlockInboxRequest),
  Api.setResponseBody(BlockInboxResponse),
  Api.addResponse({
    status: 400,
    body: BlockInboxErrors,
  })
)

export const RequestApprovalEndpoint = Api.post(
  'requestApproval',
  '/api/v1/inboxes/approval/request'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(RequestApprovalRequest),
  Api.setResponseBody(RequestApprovalResponse),
  Api.addResponse({
    status: 400,
    body: RequestApprovalErrors,
  })
)

export const CancelRequestApprovalEndpoint = Api.post(
  'cancelRequestApproval',
  '/api/v1/inboxes/approval/cancel'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CancelApprovalRequest),
  Api.setResponseBody(CancelApprovalResponse),
  Api.addResponse({
    status: 400,
    body: CancelRequestApprovalErrors,
  })
)

export const ApproveRequestEndpoint = Api.post(
  'approveRequest',
  '/api/v1/inboxes/approval/confirm'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(ApproveRequestRequest),
  Api.setResponseBody(ApproveRequestResponse),
  Api.addResponse({
    status: 400,
    body: ApproveRequestErrors,
  })
)

export const DeleteInboxesEndpoint = Api.delete(
  'deleteInboxes',
  '/api/v1/inboxes/batch',
  {deprecated: true}
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(DeleteInboxesRequest),
  Api.setResponseBody(DeleteInboxesResponse)
)

export const LeaveChatEndpoint = Api.post(
  'leaveChat',
  '/api/v1/inboxes/leave-chat'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),

  Api.setRequestBody(LeaveChatRequest),
  Api.setResponseBody(LeaveChatResponse),
  Api.addResponse({
    status: 400,
    body: LeaveChatErrors,
  })
)

export const RetrieveMessagesEndpoint = Api.put(
  'retrieveMessages',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestBody(RetrieveMessagesRequest),
  Api.setResponseBody(RetrieveMessagesResponse),
  Api.addResponse({
    status: 400,
    body: RetrieveMessagesErrors,
  })
)

export const SendMessageEndpoint = Api.post(
  'sendMessage',
  '/api/v1/inboxes/messages'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SendMessageRequest),
  Api.setResponseBody(SendMessageResponse),
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
  Api.setRequestBody(SendMessagesRequest),
  Api.setResponseBody(SendMessagesResponse),
  Api.addResponse({
    status: 400,
    body: SendMessageErrors,
  })
)

export const CreateChallengeEndpoint = Api.post(
  'createChallenge',
  '/api/v1/challenges'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengeRequest),
  Api.setResponseBody(CreateChallengeResponse)
)

export const CreateChallengeBatchEndpoint = Api.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengesRequest),
  Api.setResponseBody(CreateChallengesResponse)
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
