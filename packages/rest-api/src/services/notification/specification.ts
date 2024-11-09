import {Schema} from 'effect'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  GetPublicKeyResponse,
  InvalidFcmCypherError,
  IssueNotificationRequest,
  IssueNotificationResponse,
  SendingNotificationError,
} from './contract'

export const IssueNotificationErrors = Schema.Union(
  InvalidFcmCypherError,
  SendingNotificationError
)

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

export const GetNotificationPublicKeyEndpoint = Api.get(
  'getNotificationPublicKey',
  '/cypher-public-key'
).pipe(Api.setResponseBody(GetPublicKeyResponse))

export const NotificationApiSpecification = Api.make({
  title: 'Notification service',
}).pipe(
  Api.addEndpoint(IssueNotificationEndpoint),
  Api.addEndpoint(GetNotificationPublicKeyEndpoint)
)
