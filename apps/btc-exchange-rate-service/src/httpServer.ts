import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {redisUrl} from '@vexl-next/server-utils/src/commonConfigs'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {Layer} from 'effect'
import {cryptoConfig, healthServerPortConfig} from './configs'
import {getExchangeRateHandler} from './handlers'
import {YadioService} from './utils/yadio'

const RootLive = HttpApiBuilder.group(
  BtcExchangeRateApiSpecification,
  'root',
  (h) => h.handle('getExchangeRate', getExchangeRateHandler)
)

export const ApiLive = HttpApiBuilder.api(BtcExchangeRateApiSpecification).pipe(
  Layer.provide(RootLive),
  Layer.provide(rateLimitingMiddlewareLayer(BtcExchangeRateApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const MainLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(YadioService.Live)
)
