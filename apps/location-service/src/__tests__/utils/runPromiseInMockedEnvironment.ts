import * as NodeContext from '@effect/platform-node/NodeContext'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import DbLayer from '../../db/layer'
import {PlacesDbService} from '../../db/PlacesDbService'
import {LocationApiLive} from '../../httpServer'
import {PlacesService} from '../../places'

export type MockedContexts =
  | ServerCrypto
  | SqlClient
  | PlacesDbService
  | PlacesService
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
  Layer.provideMerge(PlacesService.Live),
  Layer.provideMerge(PlacesDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(NodeContext.layer)
)

const runtime = ManagedRuntime.make(context)
let runtimeReady = false

export const startRuntime = async (): Promise<void> => {
  await Effect.runPromise(setupTestDatabase)
  await runtime.runPromise(Console.log('Initialized the test environment'))
  runtimeReady = true
}

export const disposeRuntime = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.andThen(runtime.disposeEffect, () =>
      Console.log('Disposed test environment')
    )
  )
  await Effect.runPromise(disposeTestDatabase)
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
