import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {redisUrl} from '@vexl-next/server-utils/src/commonConfigs'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {cryptoConfig, healthServerPortConfig, portConfig} from './configs'
import {clearEventsCacheHandler, getEventsHandler} from './handlers'
import {WebflowCmsService} from './utils/webflowCms'

export const app = RouterBuilder.make(ContentApiSpecification).pipe(
  RouterBuilder.handle(getEventsHandler),
  RouterBuilder.handle(clearEventsCacheHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  ServerCrypto.layer(cryptoConfig),
  WebflowCmsService.Live,
  RedisService.layer(redisUrl),
  healthServerLayer({port: healthServerPortConfig})
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
