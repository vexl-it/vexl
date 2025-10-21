import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ServerSecurityMiddleware} from '../../apiSecurity'
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

export const ReportNotificationProcessedEndpoint = HttpApiEndpoint.post(
  'reportNotificationProcessed',
  '/report-notification'
)
  .middleware(ServerSecurityMiddleware)
  .setPayload(ReportNotificationProcessedRequest)
  .addSuccess(NoContentResponse)

export const GetNotificationPublicKeyEndpoint = HttpApiEndpoint.get(
  'getNotificationPublicKey',
  '/cypher-public-key'
).addSuccess(GetPublicKeyResponse)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(IssueNotificationEndpoint)
  .add(ReportNotificationProcessedEndpoint)
  .add(GetNotificationPublicKeyEndpoint)

export const NotificationApiSpecification = HttpApi.make('Notification API')
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
