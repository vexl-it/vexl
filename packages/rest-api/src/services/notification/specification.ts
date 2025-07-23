import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  GetPublicKeyResponse,
  IssueNotificationErrors,
  IssueNotificationRequest,
  IssueNotificationResponse,
  ReportNotificationProcessedRequest,
} from './contract'

export const IssueNotificationEndpoint = Api.post(
  'issueNotification',
  '/issue-notification'
).pipe(
  Api.setRequestBody(IssueNotificationRequest),
  Api.setResponseBody(IssueNotificationResponse),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 400,
    body: IssueNotificationErrors,
  })
)

export const ReportNotificationProcessedEndpoint = Api.post(
  'reportNotificationProcessed',
  '/report-notification'
).pipe(
  Api.setRequestBody(ReportNotificationProcessedRequest),
  Api.setResponseBody(NoContentResponse),
  Api.setSecurity(ServerSecurity)
)

export const GetNotificationPublicKeyEndpoint = Api.get(
  'getNotificationPublicKey',
  '/cypher-public-key'
).pipe(Api.setResponseBody(GetPublicKeyResponse))

export const NotificationApiSpecification = Api.make({
  title: 'Notification service',
}).pipe(
  Api.addEndpoint(IssueNotificationEndpoint),
  Api.addEndpoint(ReportNotificationProcessedEndpoint),
  Api.addEndpoint(GetNotificationPublicKeyEndpoint)
)
