import {Api} from 'effect-http'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {ReportNotificationInteractionRequest} from './contracts'

export const ReportNotificationInteractionEndpoint = Api.get(
  'reportNotificationInteraction',
  '/report/notification-interaction'
).pipe(
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestQuery(ReportNotificationInteractionRequest),
  Api.setResponseBody(NoContentResponse)
)

export const MetricsServiceSpecification = Api.make({
  title: 'Metrics service',
  version: '1.0.0',
}).pipe(Api.addEndpoint(ReportNotificationInteractionEndpoint))
