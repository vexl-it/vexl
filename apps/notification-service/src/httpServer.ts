import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpLayerRouter,
} from '@effect/platform/index'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'

import {RpcSerialization, RpcServer} from '@effect/rpc/index'
import {Rpcs} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {
  cryptoConfig,
  healthServerPortConfig,
  redisUrl,
} from '@vexl-next/server-utils/src/commonConfigs'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {Layer} from 'effect'
import {ExpoClientService} from './ExpoMessagingLayer'
import {NotificationSocketMessaging} from './NotificationSocketMessaging'
import {NotificationRpcsHandlers} from './NotificationSocketMessaging/services/NotificationRpcHandles'
import {
  TaskWorkerLayer,
  TimeoutWorkerLayer,
} from './NotificationSocketMessaging/services/SendMessageTasksManager'
import {NotificationMetricsService} from './metrics'
import {getCypherPublicKeyHandler} from './routes/getCypherPublicKeyHandler'
import {issueNotifcationHandler} from './routes/issueNotificationHandler'
import {issueStreamOnlyMessageHandler} from './routes/issueStreamOnlyMessageHandler'
import {reportNotificationProcessedHandler} from './routes/reportNotificationProcessed'
import {ExpoNotificationService} from './utils'

const RootGroupLive = HttpApiBuilder.group(
  NotificationApiSpecification,
  'root',
  (h) =>
    h
      .handle('issueNotification', issueNotifcationHandler)
      .handle('getNotificationPublicKey', getCypherPublicKeyHandler)
      .handle('reportNotificationProcessed', reportNotificationProcessedHandler)
      .handle('issueStreamOnlyMessage', issueStreamOnlyMessageHandler)
)

const NotificationHttpApiLive = HttpLayerRouter.addHttpApi(
  NotificationApiSpecification
).pipe(
  Layer.provide(RootGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(NotificationApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

const RpcRouter = RpcServer.layerHttpRouter({
  group: Rpcs,
  path: '/rpc',
  protocol: 'websocket',
}).pipe(
  Layer.provide(NotificationRpcsHandlers),
  Layer.provide(RpcSerialization.layerNdjson)
)

const ApiServerLive = HttpLayerRouter.serve(
  Layer.mergeAll(
    NotificationHttpApiLive,
    RpcRouter,
    HttpApiSwagger.layerHttpLayerRouter({
      api: NotificationApiSpecification,
      path: '/docs',
    })
  )
).pipe(Layer.provide(NodeHttpServerLiveWithPortFromEnv))

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.merge(Layer.mergeAll(TaskWorkerLayer, TimeoutWorkerLayer)),
  Layer.provideMerge(NotificationSocketMessaging.Live),
  Layer.provideMerge(ExpoNotificationService.Live),
  Layer.provideMerge(ExpoClientService.Live),
  Layer.provideMerge(NotificationMetricsService.Live),
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig))
)
