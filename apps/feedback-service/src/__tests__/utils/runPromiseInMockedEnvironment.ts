import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import DbLayer from '../../db/layer'
import {FeedbackDbService} from '../../routes/submitFeedback/db'
import {NodeTestingApp} from './NodeTestingApp'

export type MockedContexts =
  | ServerCrypto
  | NodeTestingApp
  | SqlClient
  | FeedbackDbService
  | MetricsClientService

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(FeedbackDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(mockedMetricsClientService),
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
  console.log('Disposing runtime')
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
