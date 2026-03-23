import 'dotenv/config'
//
import {DevTools, Reactivity} from '@effect/experimental'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {Effect, Fiber, Layer} from 'effect'
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

const program = Effect.gen(function* (_) {
  yield* _(setDashboardBootstrappingMessage('Starting dashboard servers'))

  const dummyData = yield* _(dummyDataConfig)

  const staticServerFiber = yield* _(
    Layer.launch(StaticServerLive).pipe(Effect.either, Effect.fork)
  )
  const updatesServerFiber = yield* _(
    Layer.launch(UpdatesServerLive).pipe(Effect.either, Effect.fork)
  )
  const socketServerFiber = yield* _(
    Layer.launch(dummyData ? DebugSocketServerLive : SocketServerLive).pipe(
      Effect.either,
      Effect.fork
    )
  )
  const healthServerFiber = yield* _(
    Layer.launch(HealthServerLive).pipe(Effect.either, Effect.fork)
  )

  yield* _(Effect.logInfo('Quering everyhting'))

  yield* _(setDashboardBootstrappingMessage('Loading user country data'))
  yield* _(syncPubKeyToCountryEffect)
  yield* _(setDashboardBootstrappingMessage('Loading connection summary'))
  yield* _(syncCountriesToConnectionsEffect)
  yield* _(setDashboardBootstrappingMessage('Loading total users'))
  yield* _(syncCountOfUsersEffect)
  yield* _(setDashboardReady)

  yield* _(Effect.logInfo('Initial query done'))

  yield* _(
    Effect.raceAll([
      Fiber.join(staticServerFiber),
      Fiber.join(updatesServerFiber),
      Fiber.join(socketServerFiber),
      Fiber.join(healthServerFiber),
    ]),
    // When one of these processes ends, we want to fail the whole program
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
        Layer.unwrapEffect
      )
    )
  ),
  Effect.provide(Reactivity.layer),
  Effect.tapError((e) =>
    Effect.logError('Error in main program', JSON.stringify(e))
  )
)

runMainInNode(program)
