import {Schema} from 'effect'
import {HttpApi, HttpApiEndpoint, HttpApiGroup} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {ReportNotificationInteractionRequest} from './contracts'

export const ReportNotificationInteractionEndpoint = HttpApiEndpoint.get(
  'reportNotificationInteraction',
  '/report/notification-interaction',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    query: ReportNotificationInteractionRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

const RootGroup = HttpApiGroup.make('root', {topLevel: true}).add(
  ReportNotificationInteractionEndpoint
)

export const MetricsApiSpecification = HttpApi.make('Metrics Service')
  .add(RootGroup)
  .middleware(RateLimitingMiddleware)
