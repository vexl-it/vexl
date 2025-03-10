import {NodeContext} from '@effect/platform-node'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {ClubInvitationLinkDbService} from '../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'
import {ClubsDbService} from '../../db/ClubsDbService'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import DbLayer from '../../db/layer'
import {ImportContactsQuotaService} from '../../routes/contacts/importContactsQuotaService'
import {type ExpoNotificationsService} from '../../utils/expoNotifications/ExpoNotificationsService'
import {type FirebaseMessagingService} from '../../utils/notifications/FirebaseMessagingService'
import {NodeTestingApp} from './NodeTestingApp'
import {mockedExpoNotificationlayer} from './mockedExpoNotificationService'
import {mockedFirebaseMessagingServiceLayer} from './mockedFirebaseMessagingService'

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
  | ClubsDbService
  | ClubMembersDbService
  | ClubInvitationLinkDbService
  | ExpoNotificationsService

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(universalContext),
  Layer.provideMerge(ImportContactsQuotaService.Live),
  Layer.provideMerge(mockedRedisLayer),
  Layer.provideMerge(mockedDashboardReportsService),
  Layer.provideMerge(UserDbService.Live),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(ContactDbService.Live),
  Layer.provideMerge(ClubsDbService.Live),
  Layer.provideMerge(ClubMembersDbService.Live),
  Layer.provideMerge(ClubInvitationLinkDbService.Live),
  Layer.provideMerge(mockedFirebaseMessagingServiceLayer),
  Layer.provideMerge(mockedExpoNotificationlayer),
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
