import {NodeContext} from '@effect/platform-node'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
} from '@vexl-next/server-utils/src/commonConfigs'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {FirebaseMessagingLayer} from './FirebaseMessagingLayer'
import {getCypherPublicKeyHandler} from './routes/getCypherPublicKeyHandler'
import {IssueNotifcationHandler} from './routes/IssueNotificationRouteLive'

export const app = RouterBuilder.make(NotificationApiSpecification).pipe(
  RouterBuilder.handle(IssueNotifcationHandler),
  RouterBuilder.handle(getCypherPublicKeyHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(FirebaseMessagingLayer.Live),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
