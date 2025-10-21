import {NodeHttpServer} from '@effect/platform-node/index'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {LocationApiLive} from '../../httpServer'
import {mockedGoogleMapLayer} from './mockedGoogleMapLayer'

export type MockedContexts = ServerCrypto | HttpClient | TestRequestHeaders

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(LocationApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)
const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(mockedGoogleMapLayer),
  Layer.provideMerge(universalContext)
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
