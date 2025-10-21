import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {ServerSecurityMiddlewareLive} from '@vexl-next/rest-api/src/apiSecurity'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {
  cryptoConfig,
  healthServerPortConfig,
  redisUrl,
} from '@vexl-next/server-utils/src/commonConfigs'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Layer} from 'effect'
import {ExpoClientService} from './ExpoMessagingLayer'
import {FirebaseMessagingLayer} from './FirebaseMessagingLayer'
import {IssueNotifcationHandler} from './routes/IssueNotificationRouteLive'
import {getCypherPublicKeyHandler} from './routes/getCypherPublicKeyHandler'
import {reportNotificationProcessedHandler} from './routes/reportNotificationProcessed'

const RootGroupLive = HttpApiBuilder.group(
  NotificationApiSpecification,
  'root',
  (h) =>
    h
      .handle('issueNotification', IssueNotifcationHandler)
      .handle('getNotificationPublicKey', getCypherPublicKeyHandler)
      .handle('reportNotificationProcessed', reportNotificationProcessedHandler)
)

const NotificationApiLive = HttpApiBuilder.api(
  NotificationApiSpecification
).pipe(
  Layer.provide(RootGroupLive),
  Layer.provide(ServerSecurityMiddlewareLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(NotificationApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(FirebaseMessagingLayer.Live),
  Layer.provideMerge(ExpoClientService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)
