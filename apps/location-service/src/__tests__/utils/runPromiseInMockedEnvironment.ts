import * as NodeContext from '@effect/platform-node/NodeContext'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {GeocodingDbLayer} from '@vexl-next/geocoding-db/src/layer'
import {
  disposeGeocodingTestDatabase,
  setupGeocodingTestDatabase,
} from '@vexl-next/geocoding-db/src/tests/testGeocodingDb'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {GeocodingService} from '../../geocoding'
import {LocationApiLive} from '../../httpServer'

export type MockedContexts =
  | ServerCrypto
  | SqlClient
  | GeocodingDbService
  | GeocodingService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(LocationApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(mockedRateLimitingLayer),
  Layer.provideMerge(GeocodingService.Live),
  Layer.provideMerge(GeocodingDbService.Live),
  Layer.provideMerge(GeocodingDbLayer),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(NodeContext.layer)
)

const runtime = ManagedRuntime.make(context)
let runtimeReady = false

export const startRuntime = async (): Promise<void> => {
  await Effect.runPromise(setupGeocodingTestDatabase)
  await runtime.runPromise(Console.log('Initialized the test environment'))
  runtimeReady = true
}

export const disposeRuntime = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.andThen(runtime.disposeEffect, () =>
      Console.log('Disposed test environment')
    )
  )
  await Effect.runPromise(disposeGeocodingTestDatabase)
  runtimeReady = false
}

export const runPromiseInMockedEnvironment = async (
  effectToRun: Effect.Effect<void, any, MockedContexts | Scope.Scope>
): Promise<void> => {
  if (!runtimeReady) throw new Error('Runtime is not ready')
  await runtime.runPromise(
    effectToRun.pipe(
      Effect.scoped,
      Effect.catchAll((e) => {
        return Effect.zipRight(
          Effect.logError('Error in test', e),
          Effect.fail(e)
        )
      })
    )
  )
}
