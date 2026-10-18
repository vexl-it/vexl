import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  AnalyticsGatewayKeyUnavailableError,
  InvalidAnalyticsStateError,
  OHTTP_REQUEST_CONTENT_TYPE,
  RELAY_TOKEN_HEADER,
  ReportNotificationInteractionRequest,
  UnknownAnalyticsRelayError,
} from './contracts'

export const ReportNotificationInteractionEndpoint = HttpApiEndpoint.get(
  'reportNotificationInteraction',
  '/report/notification-interaction'
)
  .setHeaders(CommonHeaders)
  .setUrlParams(ReportNotificationInteractionRequest)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 5000)

/**
 * OHTTP gateway: only reachable through an analytics relay, so the client IP
 * never reaches Vexl. Rate limiting therefore counts per relay.
 */
export const RelayAnalyticsStateEndpoint = HttpApiEndpoint.post(
  'relayAnalyticsState',
  '/analytics/ohttp'
)
  .setHeaders(
    Schema.Struct({[RELAY_TOKEN_HEADER]: Schema.optional(Schema.String)})
  )
  .setPayload(
    HttpApiSchema.Uint8Array({contentType: OHTTP_REQUEST_CONTENT_TYPE})
  )
  .addSuccess(NoContentResponse)
  .addError(InvalidAnalyticsStateError, {status: 400})
  .addError(UnknownAnalyticsRelayError, {status: 403})
  .addError(AnalyticsGatewayKeyUnavailableError, {status: 503})
  .annotate(MaxExpectedDailyCall, 1_000_000)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(ReportNotificationInteractionEndpoint)
  .add(RelayAnalyticsStateEndpoint)

export const MetricsApiSpecification = HttpApi.make('Metrics Service')
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
