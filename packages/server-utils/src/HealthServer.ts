import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
  type HttpServerError,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {Config, Effect, Layer} from 'effect'
import {type ConfigError} from 'effect/ConfigError'
import {createServer} from 'http'

export function makeHealthServerLive({
  port,
}: {
  port: number | Config.Config<number>
}): Layer.Layer<never, HttpServerError.ServeError | ConfigError, never> {
  const portEffect = Config.isConfig(port) ? port : Effect.succeed(port)

  const HealtServerLive = portEffect.pipe(
    Effect.map((port) =>
      NodeHttpServer.layer(() => createServer(), {
        port,
      })
    ),
    Layer.unwrapEffect
  )

  const HealthHttpLive = HttpRouter.empty.pipe(
    HttpRouter.get(
      '*',
      Effect.succeed(HttpServerResponse.text('ok', {status: 200}))
    )
  )

  const HealthAppLive = HealthHttpLive.pipe(
    HttpServer.serve(),
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
