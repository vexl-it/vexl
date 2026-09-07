import 'dotenv/config'
import {Effect, Fiber, Layer, pipe} from 'effect'
//
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {DevTools} from 'effect/unstable/devtools'
import {Reactivity} from 'effect/unstable/reactivity'
import {
  dummyDataConfig,
  healthServerPortConfig,
  isRunningInDevConfig,
} from './configs'
import {
  DashboardBootstrapState,
  setDashboardBootstrappingMessage,
  setDashboardReady,
} from './dashboardBootstrapState'
import {DbsLive} from './db/layer'
import {CountOfUsersState, syncCountOfUsersEffect} from './metrics/countOfUsers'
import {
  PubKeyToCountryPrefixState,
  syncPubKeyToCountryEffect,
} from './metrics/pubKeyToCountry'
import {
  CountriesToConnectionsCountState,
  syncCountriesToConnectionsEffect,
} from './metrics/pubKeysToConnectionsCount'
import {SocketServerLive} from './socketServer'
import {DebugSocketServerLive} from './socketServer/debugSocketServer'
import {IncommingConnectionsStreamContext} from './socketServer/serverSocket'
import {StaticServerLive} from './staticServer'
import {UpdatesServerLive} from './updatesServer'
import {HasingSalt} from './utils/hashPubKey'

const HealthServerLive = healthServerLayer({port: healthServerPortConfig})

const program = Effect.gen(function* () {
  yield* setDashboardBootstrappingMessage('Starting dashboard servers')

  const dummyData = yield* dummyDataConfig

  const staticServerFiber = yield* Layer.launch(StaticServerLive).pipe(
    Effect.result,
    Effect.forkChild
  )
  const updatesServerFiber = yield* Layer.launch(UpdatesServerLive).pipe(
    Effect.result,
    Effect.forkChild
  )
  const socketServerFiber = yield* Layer.launch(
    dummyData ? DebugSocketServerLive : SocketServerLive
  ).pipe(Effect.result, Effect.forkChild)
  const healthServerFiber = yield* Layer.launch(HealthServerLive).pipe(
    Effect.result,
    Effect.forkChild
  )

  yield* Effect.logInfo('Quering everyhting')

  yield* setDashboardBootstrappingMessage('Loading user country data')
  yield* syncPubKeyToCountryEffect
  yield* setDashboardBootstrappingMessage('Loading connection summary')
  yield* syncCountriesToConnectionsEffect
  yield* setDashboardBootstrappingMessage('Loading total users')
  yield* syncCountOfUsersEffect
  yield* setDashboardReady

  yield* Effect.logInfo('Initial query done')

  yield* pipe(
    Effect.raceAll([
      Fiber.join(staticServerFiber),
      Fiber.join(updatesServerFiber),
      Fiber.join(socketServerFiber),
      Fiber.join(healthServerFiber),
    ]),
    Effect.flatMap(Effect.fail)
  )
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      DbsLive,
      IncommingConnectionsStreamContext.Live,
      PubKeyToCountryPrefixState.Live,
      CountOfUsersState.Live,
      CountriesToConnectionsCountState.Live,
      DashboardBootstrapState.Live,
      HasingSalt.Live,
      isRunningInDevConfig.pipe(
        Effect.map((isRunningInDev) =>
          isRunningInDev ? DevTools.layer() : Layer.empty
        ),
        Layer.unwrap
      )
    )
  ),
  Effect.provide(Reactivity.layer),
  Effect.tapError((e) =>
    Effect.logError('Error in main program', JSON.stringify(e))
  )
)

runMainInNode(program)
