import 'dotenv/config'
//
import {DevTools} from '@effect/experimental'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {Effect, Layer} from 'effect'
import {
  dummyDataConfig,
  healthServerPortConfig,
  isRunningInDevConfig,
} from './configs'
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
  yield* _(Effect.logInfo('Quering everyhting'))

  yield* _(
    Effect.all(
      [
        syncPubKeyToCountryEffect,
        syncCountriesToConnectionsEffect,
        syncCountOfUsersEffect,
      ],
      {concurrency: 'unbounded'}
    )
  )

  yield* _(Effect.logInfo('Initial query done'))

  const dummyData = yield* _(dummyDataConfig)

  yield* _(
    Effect.raceAll([
      Effect.either(Layer.launch(UpdatesServerLive)),
      Effect.either(
        Layer.launch(dummyData ? DebugSocketServerLive : SocketServerLive)
      ),
      Effect.either(Layer.launch(StaticServerLive)),
      // Launch health server here, to make sure it is running when the app is healthy
      Effect.either(Layer.launch(HealthServerLive)),
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
      HasingSalt.Live,
      isRunningInDevConfig.pipe(
        Effect.map((isRunningInDev) =>
          isRunningInDev ? DevTools.layer() : Layer.empty
        ),
        Layer.unwrapEffect
      )
    )
  ),
  Effect.tapError((e) =>
    Effect.logError('Error in main program', JSON.stringify(e))
  )
)

runMainInNode(program)
