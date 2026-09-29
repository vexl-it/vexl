import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {AnalyticsStateUpsert} from '@vexl-next/analytics-definitions/src/core'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  InvalidAnalyticsStateError,
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

export const UpsertAnalyticsStateEndpoint = HttpApiEndpoint.put(
  'upsertAnalyticsState',
  '/analytics/state'
)
  .setHeaders(CommonHeaders)
  .setPayload(AnalyticsStateUpsert)
  .addSuccess(NoContentResponse)
  .addError(InvalidAnalyticsStateError, {status: 400})
  .annotate(MaxExpectedDailyCall, 300)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(ReportNotificationInteractionEndpoint)
  .add(UpsertAnalyticsStateEndpoint)

export const MetricsApiSpecification = HttpApi.make('Metrics Service')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
