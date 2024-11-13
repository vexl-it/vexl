import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {OfferDbService} from '../../db/OfferDbService'
import DbLayer from '../../db/layer'
import {NodeTestingApp} from './NodeTestingApp'

export type MockedContexts =
  | RedisService
  | NodeTestingApp
  | ServerCrypto
  | OfferDbService
  | SqlClient
  | MetricsClientService

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(universalContext),
  Layer.provideMerge(OfferDbService.Live),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(NodeContext.layer)
)

const runtime = ManagedRuntime.make(context)

export const startRuntime = async (): Promise<void> => {
  await Effect.runPromise(setupTestDatabase)
  await runtime.runPromise(Console.log('Initialized the test environment'))
}

export const disposeRuntime = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.andThen(runtime.disposeEffect, () =>
      Console.log('Disposed test environment')
    )
  )
  await Effect.runPromise(disposeTestDatabase)
}

export const runPromiseInMockedEnvironment = async (
  effectToRun: Effect.Effect<void, any, MockedContexts | Scope.Scope>
): Promise<void> => {
  await runtime.runPromise(
    effectToRun.pipe(
      Effect.scoped,
      Effect.catchAll((e) => {
        console.warn(e)
        expect(e).toBe('Error in test')
        return Console.error('Error in test', e)
      })
    )
  )
}
