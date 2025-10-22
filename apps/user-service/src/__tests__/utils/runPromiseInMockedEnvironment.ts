import {type DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {mockedDashboardReportsService} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {mockedMetricsClientService} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {mockedRedisLayer} from '@vexl-next/server-utils/src/tests/mockedRedisLayer'
import {Console, Effect, Layer, ManagedRuntime, type Scope} from 'effect'
import {cryptoConfig} from '../../configs'
import {type LoggedInUsersDbService} from '../../db/loggedInUsersDb'

import {VerificationStateDbService} from '../../routes/login/db/verificationStateDb'
import {type TwilioVerificationClient} from '../../utils/twilio'

import {NodeHttpServer} from '@effect/platform-node/index'
import {type HttpClient} from '@effect/platform/HttpClient'
import {HttpApiBuilder} from '@effect/platform/index'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {UserApiLive} from '../../httpServer'
import {mockedPreludeClient} from './mockedPreludeClient'
import {mockedTwilioLayer} from './mockedTwilioClient'
import {mockedUsersDbService} from './mockedUsersDbService'

export type MockedContexts =
  | TwilioVerificationClient
  | RedisService
  | ServerCrypto
  | LoggedInUsersDbService
  | DashboardReportsService
  | MetricsClientService
  | HttpClient
  | TestRequestHeaders

const universalContext = Layer.mergeAll(
  mockedRedisLayer,
  ServerCrypto.layer(cryptoConfig)
)

const TestServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(UserApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const context = Layer.empty.pipe(
  Layer.provideMerge(TestServerLive),
  Layer.provideMerge(TestRequestHeaders.Live),
  Layer.provideMerge(mockedTwilioLayer),
  Layer.provideMerge(mockedUsersDbService),
  Layer.provideMerge(mockedMetricsClientService),
  Layer.provideMerge(VerificationStateDbService.Live),
  Layer.provideMerge(mockedDashboardReportsService),
  Layer.provideMerge(mockedPreludeClient),
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
