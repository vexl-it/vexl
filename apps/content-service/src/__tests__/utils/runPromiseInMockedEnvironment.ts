import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import * as NodeServices from '@effect/platform-node/NodeServices'
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
import {testConfigProviderLayer} from '@vexl-next/server-utils/src/tests/testConfigProvider'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {type Job} from 'bullmq'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {HttpRouter} from 'effect/unstable/http'
import {type HttpClient} from 'effect/unstable/http/HttpClient'
import {type SqlClient} from 'effect/unstable/sql/SqlClient'
import {cryptoConfig} from '../../configs'
import {VexlProductNotificationsDbService} from '../../db/VexlProductNotificationsDbService'
import DbLayer from '../../db/layer'
import {UpdateInvoiceStateWebhookService} from '../../handlers/donations/UpdateInvoiceStateWebhookService'
import {ContentApiLive} from '../../httpServer'
import {type CacheService} from '../../utils/cache'
import {type BtcPayServerService} from '../../utils/donations'
import {type MapStylesService} from '../../utils/mapStyles'
import {type WebflowCmsService} from '../../utils/webflowCms'
import {mockedBtcPayServerService} from './mockedBtcPayServerService'
import {mockedCacheService} from './mockedCacheService'
import {mockedMapStylesService} from './mockedMapStylesService'
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
  | MapStylesService
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

const TestServerLive = HttpRouter.serve(ContentApiLive).pipe(
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
  Layer.provideMerge(mockedMapStylesService),
  Layer.provideMerge(mockedWebflowCmsService),
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

beforeEach(() => {
  enqueuedVexlProductNotifications.length = 0
  shouldFailVexlProductNotificationEnqueue = false
})
