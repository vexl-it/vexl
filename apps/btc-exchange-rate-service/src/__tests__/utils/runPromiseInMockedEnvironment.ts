import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {NodeTestingApp} from './NodeTestingApp'
import {mockedYadioLayer} from './mockedYadioLayer'

export type MockedContexts = NodeTestingApp | ServerCrypto

const universalContext = Layer.mergeAll(ServerCrypto.layer(cryptoConfig))

const context = NodeTestingApp.layer.pipe(
  Layer.provideMerge(mockedYadioLayer),
  Layer.provideMerge(universalContext)
)

const runtime = ManagedRuntime.make(context)

export const startRuntime = async (): Promise<void> => {
  await runtime.runPromise(Console.log('Initialized the test environment'))
}

export const disposeRuntime = async (): Promise<void> => {
  await Effect.runPromise(
    Effect.andThen(runtime.disposeEffect, () =>
      Console.log('Disposed test environment')
    )
  )
}

export const runPromiseInMockedEnvironment = async (
  effectToRun: Effect.Effect<void, any, MockedContexts | Scope.Scope>
): Promise<void> => {
  await runtime.runPromise(
    effectToRun.pipe(
      Effect.scoped,
      Effect.catchAll((e) => {
        console.warn(e)
        expect(e).toBe('Error in test')
        return Console.error('Error in test', e)
      })
    )
  )
}
