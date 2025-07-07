import {NodeContext} from '@effect/platform-node/index'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {UpdateInvoiceStateWebhookService} from '../../handlers/donations/UpdateInvoiceStateWebhookService'
import {type CacheService} from '../../utils/cache'
import {type BtcPayServerService} from '../../utils/donations'
import {type WebflowCmsService} from '../../utils/webflowCms'
import {NodeTestingApp} from './NodeTestingApp'
import {mockedBtcPayServerService} from './mockedBtcPayServerService'
import {mockedCacheService} from './mockedCacheService'
import {mockedWebflowCmsService} from './mockedWebflowCmsService'

export type MockedContexts =
  | RedisService
  | NodeTestingApp
  | ServerCrypto
  | MetricsClientService
  | UpdateInvoiceStateWebhookService
  | CacheService
  | WebflowCmsService
  | BtcPayServerService

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const context = NodeTestingApp.Live.pipe(
  Layer.provideMerge(universalContext),
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
  await runtime.runPromise(Console.log('Initialized the test environment'))
  runtimeReady = true
}

export const disposeRuntime = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.andThen(runtime.disposeEffect, () =>
      Console.log('Disposed test environment')
    )
  )
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
