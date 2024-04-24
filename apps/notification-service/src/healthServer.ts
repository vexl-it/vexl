import {NodeHttpServer} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {Effect, Layer} from 'effect'

import {createServer} from 'http'
import {EnvironmentConstants} from './EnvironmentLayer'

const HealtServerLive = Layer.unwrapEffect(
  EnvironmentConstants.HEALTH_PORT.pipe(
    Effect.map((port) =>
      NodeHttpServer.server.layer(() => createServer(), {port})
    )
  )
)

const HealthHttpLive = Http.router.empty.pipe(
  Http.router.get('*', Effect.succeed(Http.response.text('ok', {status: 200})))
)

const HealthAppLive = HealthHttpLive.pipe(
  Http.server.serve(),
  Layer.provide(HealtServerLive),
  Layer.provide(
    Layer.effectDiscard(
      EnvironmentConstants.HEALTH_PORT.pipe(
        Effect.flatMap((port) =>
          Effect.log(`Health server running on port ${port}`)
        )
      )
    )
  )
)

export default HealthAppLive
