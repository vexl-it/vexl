import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  CreateNotificationSecretRequest,
  CreateNotificationSecretResponse,
  GenerateNotificationTokenRequest,
  GenerateNotificationTokenResponse,
  GetPublicKeyResponse,
  InvalidateNotificationSecretRequest,
  InvalidateNotificationTokenRequest,
  InvalidFcmCypherError,
  InvalidNotificationCypherrror,
  IssueNotificationRequest,
  IssueNotificationResponse,
  IssueStreamOnlyMessageRequest,
  MissingCommonHeadersError,
  ReportNotificationProcessedRequest,
  SendingNotificationError,
  UpdateNotificationInfoRequest,
} from './contract'

export const IssueNotificationEndpoint = HttpApiEndpoint.post(
  'issueNotification',
  '/issue-notification'
)
  .setPayload(IssueNotificationRequest)
  .addSuccess(IssueNotificationResponse)
  .addError(InvalidFcmCypherError, {status: 400})
  .addError(SendingNotificationError, {status: 400})
  .addError(InvalidNotificationCypherrror, {status: 400})
  .annotate(MaxExpectedDailyCall, 5000)

export const IssueStreamOnlyMessageEndpoint = HttpApiEndpoint.post(
  'issueStreamOnlyMessage',
  '/issue-stream-only-message'
)
  .setPayload(IssueStreamOnlyMessageRequest)
  .addError(SendingNotificationError)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 500_000)

export const ReportNotificationProcessedEndpoint = HttpApiEndpoint.post(
  'reportNotificationProcessed',
  '/report-notification'
)
  .setPayload(ReportNotificationProcessedRequest)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 5000)

export const GetNotificationPublicKeyEndpoint = HttpApiEndpoint.get(
  'getNotificationPublicKey',
  '/cypher-public-key'
)
  .addSuccess(GetPublicKeyResponse)
  .annotate(MaxExpectedDailyCall, 100)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(IssueNotificationEndpoint)
  .add(ReportNotificationProcessedEndpoint)
  .add(IssueStreamOnlyMessageEndpoint)
  .add(GetNotificationPublicKeyEndpoint)

export const CreateNotificationSecretEndpoint = HttpApiEndpoint.post(
  'CreateNotificationSecret',
  '/token/create-secret'
)
  .setPayload(CreateNotificationSecretRequest)
  .setHeaders(CommonHeaders)
  .annotate(MaxExpectedDailyCall, 10)
  .addSuccess(CreateNotificationSecretResponse)
  .addError(MissingCommonHeadersError, {status: 400})

export const UpdateNotificationInfoEndpont = HttpApiEndpoint.put(
  'updateNoficationInfo',
  '/token/update'
)
  .setPayload(UpdateNotificationInfoRequest)
  .setHeaders(CommonHeaders)
  .addError(MissingCommonHeadersError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const GenerateNotificationTokenEndpoint = HttpApiEndpoint.post(
  'generateNotificationToken',
  '/token/generate'
)
  .setPayload(GenerateNotificationTokenRequest)
  .addSuccess(GenerateNotificationTokenResponse)
  .annotate(MaxExpectedDailyCall, 1_000)

export const InvalidateNotificationTokenEndpoint = HttpApiEndpoint.del(
  'invalidateNotificationToken',
  '/token/invalidate'
)
  .setPayload(InvalidateNotificationTokenRequest)
  .annotate(MaxExpectedDailyCall, 1_000)

export const InvalidateNotificationSecretEndpoint = HttpApiEndpoint.del(
  'invalidateNotificationSecret',
  '/token/invalidate/secret'
)
  .setPayload(InvalidateNotificationSecretRequest)
  .annotate(MaxExpectedDailyCall, 1_000)

const NotificationTokenGroup = HttpApiGroup.make('NotificationTokenGroup')
  .add(CreateNotificationSecretEndpoint)
  .add(UpdateNotificationInfoEndpont)
  .add(GenerateNotificationTokenEndpoint)
  .add(InvalidateNotificationTokenEndpoint)
  .add(InvalidateNotificationSecretEndpoint)

export const NotificationApiSpecification = HttpApi.make('Notification API')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .add(NotificationTokenGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
