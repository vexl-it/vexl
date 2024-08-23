import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
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
import {ContactDbService} from '../../db/ContactDbService'
import DbLayer from '../../db/layer'
import {UserDbService} from '../../db/UserDbService'
import {type FirebaseMessagingService} from '../../utils/notifications/FirebaseMessagingService'
import {mockedFirebaseMessagingServiceLayer} from './mockedFirebaseMessagingService'
import {NodeTestingApp} from './NodeTestingApp'

export type MockedContexts =
  | RedisService
  | NodeTestingApp
  | ServerCrypto
  | SqlClient
  | UserDbService
  | ContactDbService
  | FirebaseMessagingService
  | DashboardReportsService

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(universalContext),
  Layer.provideMerge(mockedDashboardReportsService),
  Layer.provideMerge(UserDbService.Live),
  Layer.provideMerge(ContactDbService.Live),
  Layer.provideMerge(mockedFirebaseMessagingServiceLayer),
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
