import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  GetPublicKeyResponse,
  InvalidFcmCypherError,
  InvalidNotificationCypherError,
  IssueNotificationRequest,
  IssueNotificationResponse,
  IssueStreamOnlyMessageRequest,
  ReportNotificationProcessedRequest,
  SendingNotificationError,
} from './contract'

export const IssueNotificationEndpoint = HttpApiEndpoint.post(
  'issueNotification',
  '/issue-notification'
)
  .setPayload(IssueNotificationRequest)
  .addSuccess(IssueNotificationResponse)
  .addError(InvalidFcmCypherError, {status: 400})
  .addError(SendingNotificationError, {status: 400})
  .addError(InvalidNotificationCypherError, {status: 400})
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

export const NotificationApiSpecification = HttpApi.make('Notification API')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
