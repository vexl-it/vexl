import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  GetPublicKeyResponse,
  IssueNotificationErrors,
  IssueNotificationRequest,
  IssueNotificationResponse,
  ReportNotificationProcessedRequest,
} from './contract'

export const IssueNotificationEndpoint = HttpApiEndpoint.post(
  'issueNotification',
  '/issue-notification'
)
  .middleware(ServerSecurityMiddleware)
  .setPayload(IssueNotificationRequest)
  .addSuccess(IssueNotificationResponse)
  .addError(IssueNotificationErrors)
  .annotate(MaxExpectedDailyCall, 5000)

export const ReportNotificationProcessedEndpoint = HttpApiEndpoint.post(
  'reportNotificationProcessed',
  '/report-notification'
)
  .middleware(ServerSecurityMiddleware)
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
  .add(GetNotificationPublicKeyEndpoint)

export const NotificationApiSpecification = HttpApi.make('Notification API')
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
