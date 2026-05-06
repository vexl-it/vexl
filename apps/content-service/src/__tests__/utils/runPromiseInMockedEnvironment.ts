import {NodeContext, NodeHttpServer} from '@effect/platform-node/index'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {type VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {EnqueueVexlProductNotification} from '@vexl-next/server-utils/src/ContentServiceVexlProductNotificationMq'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {MqServiceError} from '@vexl-next/server-utils/src/mqService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {type Job} from 'bullmq'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'
import DbLayer from '../../db/layer'
import {UpdateInvoiceStateWebhookService} from '../../handlers/donations/UpdateInvoiceStateWebhookService'
import {ContentApiLive} from '../../httpServer'
import {type CacheService} from '../../utils/cache'
import {type BtcPayServerService} from '../../utils/donations'
import {type WebflowCmsService} from '../../utils/webflowCms'
import {mockedBtcPayServerService} from './mockedBtcPayServerService'
import {mockedCacheService} from './mockedCacheService'
import {mockedWebflowCmsService} from './mockedWebflowCmsService'

export type MockedContexts =
  | RedisService
  | ServerCrypto
  | SqlClient
  | VexlProductNotificationsDbService
  | MetricsClientService
  | UpdateInvoiceStateWebhookService
  | CacheService
  | WebflowCmsService
  | BtcPayServerService
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

export const enqueuedVexlProductNotifications: VexlProductNotification[] = []
export let shouldFailVexlProductNotificationEnqueue = false

export const setShouldFailVexlProductNotificationEnqueue = (
  value: boolean
): void => {
  shouldFailVexlProductNotificationEnqueue = value
}

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))
const mockJob: Job = Object.create(null)

const mockedEnqueueVexlProductNotificationLayer = Layer.succeed(
  EnqueueVexlProductNotification,
  (task) => {
    if (shouldFailVexlProductNotificationEnqueue) {
      return Effect.fail(
        new MqServiceError({
          cause: 'test failure',
          message: 'Test enqueue failure',
        })
      )
    }

    enqueuedVexlProductNotifications.push(task)
    return Effect.succeed(mockJob)
  }
)

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(ContentApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(mockedRateLimitingLayer),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(VexlProductNotificationsDbService.Live),
  Layer.provideMerge(mockedEnqueueVexlProductNotificationLayer),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(UpdateInvoiceStateWebhookService.Live),
  Layer.provideMerge(mockedRedisLayer),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(mockedBtcPayServerService),
  Layer.provideMerge(mockedCacheService),
  Layer.provideMerge(mockedWebflowCmsService),
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

beforeEach(() => {
  enqueuedVexlProductNotifications.length = 0
  shouldFailVexlProductNotificationEnqueue = false
})
