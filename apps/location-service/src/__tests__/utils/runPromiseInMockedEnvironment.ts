import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import * as NodeServices from '@effect/platform-node/NodeServices'
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
import {testConfigProviderLayer} from '@vexl-next/server-utils/src/tests/testConfigProvider'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {HttpRouter} from 'effect/unstable/http'
import {type HttpClient} from 'effect/unstable/http/HttpClient'
import {type SqlClient} from 'effect/unstable/sql/SqlClient'
import {cryptoConfig} from '../../configs'
import {GeocodingService} from '../../geocoding'
import {LocationApiLive} from '../../httpServer'
import {type GoogleMapsService} from '../../utils/googleMapsApi'
import {mockedGoogleMapLayer} from './mockedGoogleMapLayer'

export type MockedContexts =
  | ServerCrypto
  | SqlClient
  | GeocodingDbService
  | GeocodingService
  | GoogleMapsService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

const TestServerLive = HttpRouter.serve(LocationApiLive).pipe(
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(mockedRateLimitingLayer),
  Layer.provideMerge(mockedGoogleMapLayer),
  Layer.provideMerge(GeocodingService.Live),
  Layer.provideMerge(GeocodingDbService.Live),
  Layer.provideMerge(GeocodingDbLayer),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(NodeServices.layer)
)

const runtime = ManagedRuntime.make(
  context.pipe(Layer.provideMerge(testConfigProviderLayer))
)
let runtimeReady = false

export const startRuntime = async (): Promise<void> => {
  await Effect.runPromise(setupGeocodingTestDatabase)
  await runtime.runPromise(Console.log('Initialized the test environment'))
  runtimeReady = true
}

export const disposeRuntime = async (): Promise<void> => {
  try {
    await Effect.runPromise(
      Effect.andThen(runtime.disposeEffect, () =>
        Console.log('Disposed test environment')
      )
    )
  } finally {
    try {
      await Effect.runPromise(disposeGeocodingTestDatabase)
    } finally {
      runtimeReady = false
    }
  }
}

export const runPromiseInMockedEnvironment = async (
  effectToRun: Effect.Effect<void, any, MockedContexts | Scope.Scope>
): Promise<void> => {
  if (!runtimeReady) throw new Error('Runtime is not ready')
  await runtime.runPromise(
    effectToRun.pipe(
      Effect.scoped,
      Effect.catch((e) => {
        return Effect.andThen(
          Effect.logError('Error in test', e),
          Effect.fail(e)
        )
      })
    )
  )
}
