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
import {NotificationMetricsService} from './metrics'
import {getCypherPublicKeyHandler} from './routes/getCypherPublicKeyHandler'
import {issueNotifcationHandler} from './routes/issueNotificationHandler'
import {issueStreamOnlyMessageHandler} from './routes/issueStreamOnlyMessageHandler'
import {createNotificationSecretHandler} from './routes/notificationToken/createNotificationSecretHandler'
import {generateNotificationTokenHandler} from './routes/notificationToken/generateNotificationTokenHandler'
import {invalidateNotificationSecretHandler} from './routes/notificationToken/invalidateNotificationSecretHandler'
import {invalidateNotificationTokenHandler} from './routes/notificationToken/invalidateNotificationTokenHandler'
import {updateNotificationInfoHandler} from './routes/notificationToken/updateNotificationInfoHandler'
import {reportNotificationProcessedHandler} from './routes/reportNotificationProcessed'
import {NotificationSocketMessaging} from './services/NotificationSocketMessaging'
import {NotificationRpcsHandlers} from './services/NotificationSocketMessaging/services/NotificationRpcHandles'
import {
  TaskWorkerLayer,
  TimeoutWorkerLayer,
} from './services/NotificationSocketMessaging/services/SendMessageTasksManager'
import {NotificationTokensDb} from './services/NotificationTokensDb'
import {PosgressDbLive} from './services/PostgressDb'
import {ThrottledPushNotificationService} from './services/ThrottledPushNotificationService'
import {processThrottledNotificationsWorker} from './services/ThrottledPushNotificationService/services/ThrottledNotificationMq'
import {VexlNotificationTokenService} from './services/VexlNotificationTokenService'

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

const NotificationTokenGroupLive = HttpApiBuilder.group(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  (h) =>
    h
      .handle('CreateNotificationSecret', createNotificationSecretHandler)
      .handle('updateNoficationInfo', updateNotificationInfoHandler)
      .handle('generateNotificationToken', generateNotificationTokenHandler)
      .handle('invalidateNotificationToken', invalidateNotificationTokenHandler)
      .handle(
        'invalidateNotificationSecret',
        invalidateNotificationSecretHandler
      )
)

const NotificationHttpApiLive = HttpLayerRouter.addHttpApi(
  NotificationApiSpecification
).pipe(
  Layer.provide(RootGroupLive),
  Layer.provide(NotificationTokenGroupLive),
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

const workers = Layer.mergeAll(
  TaskWorkerLayer,
  TimeoutWorkerLayer,
  processThrottledNotificationsWorker
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig}),
  workers
).pipe(
  Layer.provideMerge(NotificationSocketMessaging.Live),
  Layer.provideMerge(ThrottledPushNotificationService.Live),
  Layer.provideMerge(VexlNotificationTokenService.Live),
  Layer.provideMerge(NotificationMetricsService.Live),
  Layer.provideMerge(NotificationTokensDb.Live),
  Layer.provideMerge(PosgressDbLive),
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig))
)
