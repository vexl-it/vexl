import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {InvalidChallengeError} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  ApproveRequestErrors,
  ApproveRequestRequest,
  ApproveRequestResponse,
  BlockInboxErrors,
  BlockInboxRequest,
  BlockInboxResponse,
  CancelApprovalRequest,
  CancelApprovalResponse,
  CancelApprovalV2Request,
  CancelRequestApprovalErrors,
  CreateInboxRequest,
  CreateInboxResponse,
  DeleteInboxErrors,
  DeleteInboxRequest,
  DeleteInboxResponse,
  DeleteInboxesRequest,
  DeleteInboxesResponse,
  DeletePulledMessagesErrors,
  DeletePulledMessagesRequest,
  DeletePulledMessagesResponse,
  LeaveChatErrors,
  LeaveChatRequest,
  LeaveChatResponse,
  RequestApprovalErrors,
  RequestApprovalRequest,
  RequestApprovalResponse,
  RequestApprovalV2Errors,
  RequestApprovalV2Request,
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

export const UpdateInboxEndpoint = HttpApiEndpoint.put(
  'updateInbox',
  '/api/v1/inboxes'
)
  .annotate(OpenApi.Deprecated, true)
  .annotate(
    OpenApi.Description,
    'Not needed anymore since chat service does not sent fcm messages and does not collect fcm tokens anymore'
  )
  .setPayload(UpdateInboxRequest)
  .addSuccess(UpdateInboxResponse)
  .annotate(MaxExpectedDailyCall, 10)

export const CreateInboxEndpoint = HttpApiEndpoint.post(
  'createInbox',
  '/api/v1/inboxes'
)
  .setHeaders(CommonHeaders)
  .setPayload(CreateInboxRequest)
  .addSuccess(CreateInboxResponse)
  .addError(InvalidChallengeError)
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteInboxEndpoint = HttpApiEndpoint.del(
  'deleteInbox',
  '/api/v1/inboxes'
)
  .setPayload(DeleteInboxRequest)
  .addSuccess(DeleteInboxResponse)
  .addError(DeleteInboxErrors)
  .annotate(MaxExpectedDailyCall, 100)

export const DeletePulledMessagesEndpoint = HttpApiEndpoint.del(
  'deletePulledMessages',
  '/api/v1/inboxes/messages'
)
  .setPayload(DeletePulledMessagesRequest)
  .addSuccess(DeletePulledMessagesResponse)
  .addError(DeletePulledMessagesErrors)
  .annotate(MaxExpectedDailyCall, 5000)

export const BlockInboxEndpoint = HttpApiEndpoint.put(
  'blockInbox',
  '/api/v1/inboxes/block'
)
  .setPayload(BlockInboxRequest)
  .addSuccess(BlockInboxResponse)
  .addError(BlockInboxErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const RequestApprovalEndpoint = HttpApiEndpoint.post(
  'requestApproval',
  '/api/v1/inboxes/approval/request'
)
  .middleware(ServerSecurityMiddleware)
  .setPayload(RequestApprovalRequest)
  .addSuccess(RequestApprovalResponse)
  .addError(RequestApprovalErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const RequestApprovalV2Endpoint = HttpApiEndpoint.post(
  'requestApprovalV2',
  '/api/v2/inboxes/approval/request'
)
  .setPayload(RequestApprovalV2Request)
  .addSuccess(RequestApprovalResponse)
  .addError(RequestApprovalV2Errors)
  .annotate(MaxExpectedDailyCall, 50)

export const CancelRequestApprovalEndpoint = HttpApiEndpoint.post(
  'cancelRequestApproval',
  '/api/v1/inboxes/approval/cancel'
)
  .middleware(ServerSecurityMiddleware)
  .setPayload(CancelApprovalRequest)
  .addSuccess(CancelApprovalResponse)
  .addError(CancelRequestApprovalErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const CancelRequestApprovalV2Endpoint = HttpApiEndpoint.post(
  'cancelRequestApprovalV2',
  '/api/v2/inboxes/approval/cancel'
)
  .setPayload(CancelApprovalV2Request)
  .addSuccess(CancelApprovalResponse)
  .addError(CancelRequestApprovalErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const ApproveRequestEndpoint = HttpApiEndpoint.post(
  'approveRequest',
  '/api/v1/inboxes/approval/confirm'
)
  .setPayload(ApproveRequestRequest)
  .addSuccess(ApproveRequestResponse)
  .addError(ApproveRequestErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const DeleteInboxesEndpoint = HttpApiEndpoint.del(
  'deleteInboxes',
  '/api/v1/inboxes/batch'
)
  .annotate(OpenApi.Deprecated, true)
  .setPayload(DeleteInboxesRequest)
  .addSuccess(DeleteInboxesResponse)
  .addError(DeleteInboxErrors)
  .annotate(MaxExpectedDailyCall, 10)

export const LeaveChatEndpoint = HttpApiEndpoint.post(
  'leaveChat',
  '/api/v1/inboxes/leave-chat'
)
  .setPayload(LeaveChatRequest)
  .addSuccess(LeaveChatResponse)
  .addError(LeaveChatErrors)
  .annotate(MaxExpectedDailyCall, 50)

export const RetrieveMessagesEndpoint = HttpApiEndpoint.put(
  'retrieveMessages',
  '/api/v1/inboxes/messages'
)
  .setHeaders(CommonHeaders)
  .setPayload(RetrieveMessagesRequest)
  .addSuccess(RetrieveMessagesResponse)
  .addError(RetrieveMessagesErrors)
  .annotate(MaxExpectedDailyCall, 5000)

export const SendMessageEndpoint = HttpApiEndpoint.post(
  'sendMessage',
  '/api/v1/inboxes/messages'
)
  .setPayload(SendMessageRequest)
  .addSuccess(SendMessageResponse)
  .addError(SendMessageErrors)
  .annotate(MaxExpectedDailyCall, 5000)

export const SendMessagesEndpoint = HttpApiEndpoint.post(
  'sendMessages',
  '/api/v1/inboxes/messages/batch'
)
  .annotate(OpenApi.Deprecated, true)
  .setPayload(SendMessagesRequest)
  .addSuccess(SendMessagesResponse)
  .addError(SendMessageErrors)
  .annotate(MaxExpectedDailyCall, 10)

const InboxesApiGroup = HttpApiGroup.make('Inboxes')
  .add(UpdateInboxEndpoint)
  .add(CreateInboxEndpoint)
  .add(DeleteInboxEndpoint)
  .add(BlockInboxEndpoint)
  .add(RequestApprovalEndpoint)
  .add(RequestApprovalV2Endpoint)
  .add(CancelRequestApprovalEndpoint)
  .add(CancelRequestApprovalV2Endpoint)
  .add(ApproveRequestEndpoint)
  .add(DeleteInboxesEndpoint)
  .add(LeaveChatEndpoint)
  .add(DeletePulledMessagesEndpoint)

const MessagesApiGroup = HttpApiGroup.make('Messages')
  .add(RetrieveMessagesEndpoint)
  .add(SendMessageEndpoint)
  .add(SendMessagesEndpoint)

export const ChatApiSpecification = HttpApi.make('Chat API')
  .middleware(RateLimitingMiddleware)
  .add(InboxesApiGroup)
  .add(MessagesApiGroup)
  .add(ChallengeApiGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
