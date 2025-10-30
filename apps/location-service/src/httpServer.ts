import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
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
import {
  getGeocodedCoordinatesHandler,
  getLocationSuggestionHandler,
} from './handlers'
import {GoogleMapsService} from './utils/googleMapsApi'

const RootApiGroupLive = HttpApiBuilder.group(
  LocationApiSpecification,
  'root',
  (h) =>
    h
      .handle('getGeocodedCoordinates', getGeocodedCoordinatesHandler)
      .handle('getLocationSuggestion', getLocationSuggestionHandler)
)

export const LocationApiLive = HttpApiBuilder.api(
  LocationApiSpecification
).pipe(
  Layer.provide(RootApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(LocationApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(LocationApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provide(RateLimitingService.Live),
  Layer.provide(RedisConnectionService.layer(redisUrl)),
  Layer.provide(ServerCrypto.layer(cryptoConfig)),
  Layer.provide(GoogleMapsService.Live)
)
