import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform/index'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {Effect, Layer, Option} from 'effect/index'
import {reportNotificationInteraction} from './routes/reportNotificationInteraction'
import {upsertAnalyticsState} from './routes/upsertAnalyticsState'
import {ANALYTICS_BODY_SIZE_LIMIT_BYTES} from './utils/analyticsStateRules'

const RootApiGroupLive = HttpApiBuilder.group(
  MetricsApiSpecification,
  'root',
  (h) =>
    h
      .handle('reportNotificationInteraction', reportNotificationInteraction)
      .handle('upsertAnalyticsState', upsertAnalyticsState)
)

const declaredBodySize = (
  request: HttpServerRequest.HttpServerRequest
): number => Number(request.headers['content-length'] ?? 0)

const bodySizeLimitLayer = HttpApiBuilder.middleware((app) =>
  Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) =>
    declaredBodySize(request) > ANALYTICS_BODY_SIZE_LIMIT_BYTES
      ? Effect.succeed(HttpServerResponse.empty({status: 413}))
      : HttpServerRequest.withMaxBodySize(
          app,
          Option.some(ANALYTICS_BODY_SIZE_LIMIT_BYTES)
        )
  )
)

export const MetricsApiLive = HttpApiBuilder.api(MetricsApiSpecification).pipe(
  Layer.provide(RootApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(MetricsApiSpecification)),
  Layer.provide(bodySizeLimitLayer)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(MetricsApiLive),
  Layer.provideMerge(RateLimitingService.Live),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)
