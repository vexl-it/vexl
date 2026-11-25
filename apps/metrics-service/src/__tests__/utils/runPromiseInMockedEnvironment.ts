import * as NodeContext from '@effect/platform-node/NodeContext'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import DbLayer from '../../db/layer'
import {MetricsDbService} from '../../db/MetricsDbService'
import {MetricsApiLive} from '../../httpServer'

export type MockedContexts =
  | RedisService
  | SqlClient
  | MetricsDbService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(MetricsApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(mockedRateLimitingLayer),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(MetricsDbService.Live),
  Layer.provideMerge(mockedRedisLayer),
  Layer.provideMerge(DbLayer),
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
  effectToRun: Effect.Effect<void, unknown, MockedContexts | Scope.Scope>
): Promise<void> => {
  if (!runtimeReady) throw new Error('Runtime is not ready')
  await runtime.runPromise(
    effectToRun.pipe(
      Effect.scoped,
      Effect.catchAll((e) =>
        Effect.zipRight(Effect.logError('Error in test', e), Effect.fail(e))
      )
    )
  )
}
