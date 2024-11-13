import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {cryptoConfig, healthServerPortConfig, portConfig} from './configs'
import {getExchangeRateHandler} from './handlers'
import {YadioService} from './utils/yadio'

export const app = RouterBuilder.make(BtcExchangeRateApiSpecification).pipe(
  RouterBuilder.handle(getExchangeRateHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  ServerCrypto.layer(cryptoConfig),
  YadioService.Live,
  healthServerLayer({port: healthServerPortConfig})
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)
