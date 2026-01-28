import {NodeContext, NodeHttpServer} from '@effect/platform-node'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
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
import {ContactApiLive} from '../../httpServer'
import {ImportContactsQuotaService} from '../../routes/contacts/importContactsQuotaService'
import {UserNotificationService} from '../../services/UserNotificationService'
import {type S3Service} from '../../utils/S3Service'
import {mockedEnqueueUserNotificationLayer} from './mockEnqueueUserNotification'
import {mockedS3ServiceLayer} from './mockedS3Service'

export type MockedContexts =
  | RedisService
  | S3Service
  | ServerCrypto
  | SqlClient
  | UserDbService
  | ContactDbService
  | DashboardReportsService
  | MetricsClientService
  | ImportContactsQuotaService
  | ClubsDbService
  | ClubMembersDbService
  | ClubInvitationLinkDbService
  | ChallengeService
  | ChallengeDbService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService
  | UserNotificationService

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(ContactApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const mockServiceLayers = Layer.mergeAll(
  mockedRateLimitingLayer,
  mockedRedisLayer,
  mockedS3ServiceLayer,
  mockedDashboardReportsService,
  mockedMetricsClientService
)

const UserNotificationServiceTest = UserNotificationService.Layer.pipe(
  Layer.provide(mockedEnqueueUserNotificationLayer)
)

const dbServiceLayers = Layer.mergeAll(
  UserDbService.Live,
  ContactDbService.Live,
  ClubsDbService.Live,
  ClubMembersDbService.Live,
  ClubInvitationLinkDbService.Live,
  ChallengeDbService.Live
).pipe(Layer.provideMerge(DbLayer))

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(UserNotificationServiceTest),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(ImportContactsQuotaService.Live),
  Layer.provideMerge(ChallengeService.Live),
  Layer.provideMerge(mockServiceLayers),
  Layer.provideMerge(dbServiceLayers),
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
