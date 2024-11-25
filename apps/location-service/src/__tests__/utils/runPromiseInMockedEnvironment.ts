import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {NodeTestingApp} from './NodeTestingApp'
import {mockedGoogleMapLayer} from './mockedGoogleMapLayer'

export type MockedContexts = NodeTestingApp | ServerCrypto

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const context = NodeTestingApp.layer.pipe(
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
