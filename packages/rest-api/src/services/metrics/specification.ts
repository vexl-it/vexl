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
  ReportFrontendEventRequest,
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

export const ReportFrontendEventEndpoint = HttpApiEndpoint.post(
  'reportFrontendEvent',
  '/report/frontend-event'
)
  .setHeaders(CommonHeaders)
  .setPayload(ReportFrontendEventRequest)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 500_000)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(ReportNotificationInteractionEndpoint)
  .add(ReportFrontendEventEndpoint)

export const MetricsApiSpecification = HttpApi.make('Metrics Service')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
