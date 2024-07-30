import {Schema} from '@effect/schema'
import {
  BtcExchangeRateServiceSpecification,
  TestEndpoint,
} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {Handler, RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {cryptoConfig, healthServerPortConfig, portConfig} from './configs'
import {getExchangeRateHandler} from './handlers'
import {YadioService} from './utils/yadio'

export const app = RouterBuilder.make(BtcExchangeRateServiceSpecification).pipe(
  RouterBuilder.handle(getExchangeRateHandler),
  RouterBuilder.handle(
    Handler.make(TestEndpoint, (req) =>
      makeEndpointEffect(
        Effect.gen(function* (_) {
          return 'ok'
        }).pipe(Effect.withSpan('getExchangeRateHandler')),
        Schema.Void
      )
    )
  ),
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
