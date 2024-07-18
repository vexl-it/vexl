import {LocationServiceSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {cryptoConfig, healthServerPortConfig, portConfig} from './configs'
import {
  getExchangeRateHandler,
  getGeocodedCoordinatesRequest,
  getLocationSuggestionHandler,
} from './handlers'
import {GoogleMapsService} from './utils/googleMapsApi'
import {YadioService} from './utils/yadio'

export const app = RouterBuilder.make(LocationServiceSpecification).pipe(
  RouterBuilder.handle(getExchangeRateHandler),
  RouterBuilder.handle(getGeocodedCoordinatesRequest),
  RouterBuilder.handle(getLocationSuggestionHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  ServerCrypto.layer(cryptoConfig),
  YadioService.Live,
  GoogleMapsService.Live,
  healthServerLayer({port: healthServerPortConfig})
)
export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
