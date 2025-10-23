import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {Layer} from 'effect/index'
import {reportNotificationInteraction} from './routes/reportNotificationInteraction'

const RootApiGroupLive = HttpApiBuilder.group(
  MetricsApiSpecification,
  'root',
  (h) =>
    h.handle('reportNotificationInteraction', reportNotificationInteraction)
)

export const MetricsApiLive = HttpApiBuilder.api(MetricsApiSpecification).pipe(
  Layer.provide(RootApiGroupLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(MetricsApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)
