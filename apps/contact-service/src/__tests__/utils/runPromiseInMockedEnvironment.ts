import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
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
import {ImportContactsQuotaService} from '../../routes/contacts/importContactsQuotaService'
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
  | MetricsClientService
  | ImportContactsQuotaService

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(universalContext),
  Layer.provideMerge(ImportContactsQuotaService.Live),
  Layer.provideMerge(mockedRedisLayer),
  Layer.provideMerge(mockedDashboardReportsService),
  Layer.provideMerge(UserDbService.Live),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(ContactDbService.Live),
  Layer.provideMerge(mockedFirebaseMessagingServiceLayer),
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
