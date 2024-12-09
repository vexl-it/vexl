import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {ChallengeDbService} from '../../db/ChallegeDbService'
import {InboxDbService} from '../../db/InboxDbService'
import DbLayer from '../../db/layer'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {ChatChallengeService} from '../../utils/ChatChallengeService'
import {NodeTestingApp} from './NodeTestingApp'

export type MockedContexts =
  | RedisService
  | NodeTestingApp
  | ServerCrypto
  | SqlClient
  | ChallengeDbService
  | InboxDbService
  | MessagesDbService
  | WhitelistDbService

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(ChatChallengeService.Live),
  Layer.provideMerge(
    Layer.mergeAll(
      ChallengeDbService.Live,
      InboxDbService.Live,
      MessagesDbService.Live,
      WhitelistDbService.Live
    )
  ),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(mockedDashboardReportsService),
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
