import {NodeContext, NodeHttpServer} from '@effect/platform-node'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {OfferDbService} from '../../db/OfferDbService'
import DbLayer from '../../db/layer'
import {OfferApiLive} from '../../httpServer'

export type MockedContexts =
  | RedisService
  | ServerCrypto
  | OfferDbService
  | SqlClient
  | MetricsClientService
  | ChallengeDbService
  | HttpClient
  | TestRequestHeaders

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)
const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(OfferApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(ChallengeService.Live),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(OfferDbService.Live),
  Layer.provideMerge(ChallengeDbService.Live),
  Layer.provideMerge(mockedMetricsClientService),
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
