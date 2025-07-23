import {NodeContext} from '@effect/platform-node'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from '@vexl-next/server-utils/src/commonConfigs'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {ExpoClientService} from './ExpoMessagingLayer'
import {FirebaseMessagingLayer} from './FirebaseMessagingLayer'
import {IssueNotifcationHandler} from './routes/IssueNotificationRouteLive'
import {getCypherPublicKeyHandler} from './routes/getCypherPublicKeyHandler'
import {reportNotificationProcessedHandler} from './routes/reportNotificationProcessed'

export const app = RouterBuilder.make(NotificationApiSpecification).pipe(
  RouterBuilder.handle(IssueNotifcationHandler),
  RouterBuilder.handle(getCypherPublicKeyHandler),
  RouterBuilder.handle(reportNotificationProcessedHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(FirebaseMessagingLayer.Live),
  Layer.provideMerge(ExpoClientService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
