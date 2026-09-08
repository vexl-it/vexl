import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import * as NodeServices from '@effect/platform-node/NodeServices'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {testConfigProviderLayer} from '@vexl-next/server-utils/src/tests/testConfigProvider'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {HttpRouter} from 'effect/unstable/http'
import {type HttpClient} from 'effect/unstable/http/HttpClient'
import {type SqlClient} from 'effect/unstable/sql/SqlClient'
import {cryptoConfig} from '../../configs'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import DbLayer from '../../db/layer'
import {ChatApiLive} from '../../httpServer'

export type MockedContexts =
  | RedisService
  | ServerCrypto
  | SqlClient
  | InboxDbService
  | MessagesDbService
  | MetricsClientService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)
const TestServerLive = HttpRouter.serve(ChatApiLive).pipe(
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(mockedRateLimitingLayer),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(
    Layer.mergeAll(InboxDbService.Live, MessagesDbService.Live)
  ),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(mockedDashboardReportsService),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(NodeServices.layer)
)

const runtime = ManagedRuntime.make(
  context.pipe(Layer.provideMerge(testConfigProviderLayer))
)
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
      Effect.catch((e) => {
        return Effect.andThen(
          Effect.logError('Error in test', e),
          Effect.fail(e)
        )
      })
    )
  )
}
