import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Layer} from 'effect'
import {HttpRouter} from 'effect/unstable/http'
import {HttpApiBuilder, HttpApiSwagger} from 'effect/unstable/httpapi'
import {reportNotificationInteraction} from './routes/reportNotificationInteraction'

const RootApiGroupLive = HttpApiBuilder.group(
  MetricsApiSpecification,
  'root',
  (h) =>
    h.handle('reportNotificationInteraction', reportNotificationInteraction)
)

export const MetricsApiLive = HttpApiBuilder.layer(
  MetricsApiSpecification
).pipe(
  Layer.provide(RootApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(MetricsApiSpecification))
)

export const ApiServerLive = HttpRouter.serve(
  Layer.mergeAll(MetricsApiLive, HttpApiSwagger.layer(MetricsApiSpecification))
).pipe(
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)
