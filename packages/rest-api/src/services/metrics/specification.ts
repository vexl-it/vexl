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
  ReportAnalyticsEventRequest,
  ReportNotificationInteractionRequest,
} from './contracts'

export const ReportNotificationInteractionEndpoint = HttpApiEndpoint.get(
  'reportNotificationInteraction',
  '/report/notification-interaction'
)
  .setHeaders(CommonHeaders)
  .setUrlParams(ReportNotificationInteractionRequest)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 5000)

export const ReportAnalyticsEvent = HttpApiEndpoint.post(
  'reportAnalyticsEvent',
  '/report/analytics-event'
)
  .setHeaders(CommonHeaders)
  .setPayload(ReportAnalyticsEventRequest)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 5000)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(ReportNotificationInteractionEndpoint)
  .add(ReportAnalyticsEvent)

export const MetricsApiSpecification = HttpApi.make('Metrics Service')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
