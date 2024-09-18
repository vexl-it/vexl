import {NodeContext} from '@effect/platform-node'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import DbLayer from './db/layer'
import {internalServerLive} from './internalServer'

export const app = RouterBuilder.make(ChatApiSpecification).pipe(
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  internalServerLive,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
