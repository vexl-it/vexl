import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from 'effect/unstable/httpapi'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {InvalidChallengeError} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  ForbiddenMessageTyperror,
  InboxDoesNotExistError,
} from '../contact/contracts'
import {
  ApproveRequestRequest,
  ApproveRequestResponse,
  BlockInboxRequest,
  BlockInboxResponse,
  CancelApprovalRequest,
  CancelApprovalResponse,
  CancelApprovalV2Request,
  CreateInboxRequest,
  CreateInboxResponse,
  DeleteInboxRequest,
  DeleteInboxResponse,
  DeleteInboxesRequest,
  DeleteInboxesResponse,
  DeletePulledMessagesRequest,
  DeletePulledMessagesResponse,
  LeaveChatRequest,
  LeaveChatResponse,
  ReceiverInboxDoesNotExistError,
  RequestApprovalRequest,
  RequestApprovalResponse,
  RequestApprovalV2Request,
  RetrieveMessagesRequest,
  RetrieveMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  SendMessagesRequest,
  SendMessagesResponse,
  SenderInboxDoesNotExistError,
  UpdateInboxRequest,
  UpdateInboxResponse,
} from './contracts'

export const UpdateInboxEndpoint = HttpApiEndpoint.put(
  'updateInbox',
  '/api/v1/inboxes',
  {
    disableCodecs: true,
    payload: UpdateInboxRequest,
    error: Schema.Union([...commonApiErrors]),
    success: UpdateInboxResponse,
  }
)
  .annotate(OpenApi.Deprecated, true)
  .annotate(
    OpenApi.Description,
    'Not needed anymore since chat service does not sent fcm messages and does not collect fcm tokens anymore'
  )
  .annotate(MaxExpectedDailyCall, 10)

export const CreateInboxEndpoint = HttpApiEndpoint.post(
  'createInbox',
  '/api/v1/inboxes',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: CreateInboxRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: CreateInboxResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const DeleteInboxEndpoint = HttpApiEndpoint.delete(
  'deleteInbox',
  '/api/v1/inboxes',
  {
    disableCodecs: true,
    payload: DeleteInboxRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      InboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: DeleteInboxResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const DeletePulledMessagesEndpoint = HttpApiEndpoint.delete(
  'deletePulledMessages',
  '/api/v1/inboxes/messages',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: DeletePulledMessagesRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      InboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: DeletePulledMessagesResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const BlockInboxEndpoint = HttpApiEndpoint.put(
  'blockInbox',
  '/api/v1/inboxes/block',
  {
    disableCodecs: true,
    payload: BlockInboxRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: BlockInboxResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const RequestApprovalEndpoint = HttpApiEndpoint.post(
  'requestApproval',
  '/api/v1/inboxes/approval/request',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: RequestApprovalRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: RequestApprovalResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const RequestApprovalV2Endpoint = HttpApiEndpoint.post(
  'requestApprovalV2',
  '/api/v2/inboxes/approval/request',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: RequestApprovalV2Request,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: RequestApprovalResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const CancelRequestApprovalEndpoint = HttpApiEndpoint.post(
  'cancelRequestApproval',
  '/api/v1/inboxes/approval/cancel',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: CancelApprovalRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: CancelApprovalResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const CancelRequestApprovalV2Endpoint = HttpApiEndpoint.post(
  'cancelRequestApprovalV2',
  '/api/v2/inboxes/approval/cancel',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: CancelApprovalV2Request,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: CancelApprovalResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const ApproveRequestEndpoint = HttpApiEndpoint.post(
  'approveRequest',
  '/api/v1/inboxes/approval/confirm',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: ApproveRequestRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: ApproveRequestResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const DeleteInboxesEndpoint = HttpApiEndpoint.delete(
  'deleteInboxes',
  '/api/v1/inboxes/batch',
  {
    disableCodecs: true,
    payload: DeleteInboxesRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      InboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: DeleteInboxesResponse,
  }
)
  .annotate(OpenApi.Deprecated, true)
  .annotate(MaxExpectedDailyCall, 10)

export const LeaveChatEndpoint = HttpApiEndpoint.post(
  'leaveChat',
  '/api/v1/inboxes/leave-chat',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: LeaveChatRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
    ]),
    success: LeaveChatResponse,
  }
).annotate(MaxExpectedDailyCall, 50)

export const RetrieveMessagesEndpoint = HttpApiEndpoint.put(
  'retrieveMessages',
  '/api/v1/inboxes/messages',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: RetrieveMessagesRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: RetrieveMessagesResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const SendMessageEndpoint = HttpApiEndpoint.post(
  'sendMessage',
  '/api/v1/inboxes/messages',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: SendMessageRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      ForbiddenMessageTyperror.pipe(HttpApiSchema.status(400)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: SendMessageResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const SendMessagesEndpoint = HttpApiEndpoint.post(
  'sendMessages',
  '/api/v1/inboxes/messages/batch',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: SendMessagesRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReceiverInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      SenderInboxDoesNotExistError.pipe(HttpApiSchema.status(404)),
      ForbiddenMessageTyperror.pipe(HttpApiSchema.status(400)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: SendMessagesResponse,
  }
)
  .annotate(OpenApi.Deprecated, true)
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
  .add(InboxesApiGroup)
  .add(MessagesApiGroup)
  .add(ChallengeApiGroup)
  .middleware(RateLimitingMiddleware)
