import {NodeContext, NodeHttpServer} from '@effect/platform-node/index'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type SqlClient} from '@effect/sql/SqlClient'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  GetPublicKeyResponse,
  IssueNotificationResponse,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {type RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {cryptoConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRateLimitingLayer} from '@vexl-next/server-utils/src/tests/mockedRateLimitingLayer'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeTestDatabase,
  setupTestDatabase,
} from '@vexl-next/server-utils/src/tests/testDb'
import {
  Console,
  Effect,
  Layer,
  ManagedRuntime,
  Schema,
  type Scope,
} from 'effect'
import {createNotificationSecretHandler} from '../../routes/createNotificationSecretHandler'
import {generateNotificationTokenHandler} from '../../routes/generateNotificationTokenHandler'
import {invalidateNotificationSecretHandler} from '../../routes/invalidateNotificationSecretHandler'
import {invalidateNotificationTokenHandler} from '../../routes/invalidateNotificationTokenHandler'
import {updateNotificationInfoHandler} from '../../routes/updateNotificationInfoHandler'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'
import {PosgressDbLive} from '../../services/PostgressDb'

export type MockedContexts =
  | RedisService
  | ServerCrypto
  | MetricsClientService
  | NotificationTokensDb
  | SqlClient
  | HttpClient
  | TestRequestHeaders
  | RateLimitingService

// Dummy public key for stub handler
const testPublicKey = Schema.decodeSync(PublicKeyPemBase64E)(
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

const dbServiceLayers = NotificationTokensDb.Live.pipe(
  Layer.provideMerge(PosgressDbLive)
)

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(universalContext),
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
