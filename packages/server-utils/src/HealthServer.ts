import {NodeHttpServer} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {Config, Effect, Layer} from 'effect'
import {type ConfigError} from 'effect/ConfigError'

import {createServer} from 'http'

export function makeHealthServerLive({
  port,
}: {
  port: number | Config.Config<number>
}): Layer.Layer<never, Http.error.ServeError | ConfigError, never> {
  const portEffect = Config.isConfig(port) ? port : Effect.succeed(port)

  const HealtServerLive = portEffect.pipe(
    Effect.map((port) =>
      NodeHttpServer.server.layer(() => createServer(), {
        port,
      })
    ),
    Layer.unwrapEffect
  )

  const HealthHttpLive = Http.router.empty.pipe(
    Http.router.get(
      '*',
      Effect.succeed(Http.response.text('ok', {status: 200}))
    )
  )

  const HealthAppLive = HealthHttpLive.pipe(
    Http.server.serve(),
    Layer.provide(HealtServerLive),
    Layer.tap(() =>
      portEffect.pipe(
        Effect.flatMap((port) =>
          Effect.log(`Health server running on port ${port}`)
        )
      )
    )
  )

  return HealthAppLive
}
