import {NodeContext, NodeHttpServer} from '@effect/platform-node/index'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  GetPublicKeyResponse,
  IssueNotificationResponse,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {
  EnqueueUserNotification,
  type UserNotificationMqEntry,
} from '@vexl-next/server-utils/src/UserNotificationMq'
import {cryptoConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {MqServiceError} from '@vexl-next/server-utils/src/mqService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {type Job} from 'bullmq'
import {Console, Effect, Layer, ManagedRuntime, Schema} from 'effect'
import {createNotificationSecretHandler} from '../../routes/notificationToken/createNotificationSecretHandler'
import {generateNotificationTokenHandler} from '../../routes/notificationToken/generateNotificationTokenHandler'
import {invalidateNotificationSecretHandler} from '../../routes/notificationToken/invalidateNotificationSecretHandler'
import {invalidateNotificationTokenHandler} from '../../routes/notificationToken/invalidateNotificationTokenHandler'
import {updateNotificationInfoHandler} from '../../routes/notificationToken/updateNotificationInfoHandler'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'
import {PendingBatchedNotificationsDb} from '../../services/PendingBatchedNotificationsDb'
import {PosgressDbLive} from '../../services/PostgressDb'
import {VexlNotificationTokenService} from '../../services/VexlNotificationTokenService'

export type MockedContexts =
  | RedisService
  | ServerCrypto
  | MetricsClientService
  | NotificationTokensDb
  | PendingBatchedNotificationsDb
  | SqlClient
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

export const enqueuedUserNotifications: Array<
  typeof UserNotificationMqEntry.Type
> = []
const failedUserNotificationTokens = new Set<string>()

export const failUserNotificationEnqueueForToken = (token: string): void => {
  failedUserNotificationTokens.add(token)
}

// Dummy public key for stub handler
const testPublicKey = Schema.decodeSync(PublicKeyPemBase64)(
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRFFnQUVidE9rYzJ0RmZ5VHhkVmxqSzlPQUZGYXFMMVRwU3FUaQpLbGpNenVPbjh5WjVUM3I4c04vdmUvbWdlUzg4ckNBZ29tVnJpK2pMdFU1WXQvVzlVbVozS1E9PQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0K'
)

// Stub handlers for root group endpoints (not tested, just satisfy type requirements)
const stubIssueNotificationHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueNotification',
  () => Effect.succeed(new IssueNotificationResponse({success: true}))
)

const stubGetNotificationPublicKeyHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'getNotificationPublicKey',
  () => Effect.succeed(GetPublicKeyResponse.make({publicKey: testPublicKey}))
)

const stubReportNotificationProcessedHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'reportNotificationProcessed',
  () => Effect.void
)

const stubIssueStreamOnlyMessageHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  () => Effect.void
)

// Root group with stub handlers for testing
const RootGroupLiveStub = HttpApiBuilder.group(
  NotificationApiSpecification,
  'root',
  (h) =>
    h
      .handle('issueNotification', stubIssueNotificationHandler)
      .handle('getNotificationPublicKey', stubGetNotificationPublicKeyHandler)
      .handle(
        'reportNotificationProcessed',
        stubReportNotificationProcessedHandler
      )
      .handle('issueStreamOnlyMessage', stubIssueStreamOnlyMessageHandler)
)

// Create a test-only API layer with the NotificationTokenGroup handlers
const NotificationTokenGroupLive = HttpApiBuilder.group(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  (h) =>
    h
      .handle('CreateNotificationSecret', createNotificationSecretHandler)
      .handle('updateNoficationInfo', updateNotificationInfoHandler)
      .handle('generateNotificationToken', generateNotificationTokenHandler)
      .handle('invalidateNotificationToken', invalidateNotificationTokenHandler)
      .handle(
        'invalidateNotificationSecret',
        invalidateNotificationSecretHandler
      )
)

const TestNotificationApiLive = HttpApiBuilder.api(
  NotificationApiSpecification
).pipe(
  Layer.provide(RootGroupLiveStub),
  Layer.provide(NotificationTokenGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(NotificationApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(TestNotificationApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const mockServiceLayers = Layer.mergeAll(
  mockedRateLimitingLayer,
  mockedRedisLayer,
  mockedMetricsClientService
)

const mockJob: Job = Object.create(null)

const mockedEnqueueUserNotificationLayer = Layer.succeed(
  EnqueueUserNotification,
  (task) => {
    if (task.token !== null && failedUserNotificationTokens.has(task.token)) {
      return Effect.fail(
        new MqServiceError({
          cause: 'test failure',
          message: 'Test enqueue failure',
        })
      )
    }

    enqueuedUserNotifications.push(task)
    return Effect.succeed(mockJob)
  }
)

const dbServiceLayers = Layer.mergeAll(
  NotificationTokensDb.Live,
  PendingBatchedNotificationsDb.Live
).pipe(
  Layer.provideMerge(PosgressDbLive),
  Layer.provideMerge(mockedEnqueueUserNotificationLayer)
)

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(universalContext),
  Layer.provideMerge(mockServiceLayers),
  Layer.provideMerge(VexlNotificationTokenService.Live),
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
  effectToRun: Effect.Effect<void, any, any>
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
  enqueuedUserNotifications.length = 0
  failedUserNotificationTokens.clear()
})
