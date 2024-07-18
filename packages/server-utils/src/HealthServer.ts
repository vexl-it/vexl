import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
  type HttpServerError,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {Config, Effect, Layer, Option} from 'effect'
import {type ConfigError} from 'effect/ConfigError'
import {createServer} from 'http'

// this is too complicated for what it does. I know ...
export function healthServerLayer({
  port: portConfig,
}: {
  port: number | Config.Config<Option.Option<number>>
}): Layer.Layer<never, HttpServerError.ServeError | ConfigError, never> {
  return Effect.gen(function* (_) {
    const portOption = yield* _(
      Config.isConfig(portConfig)
        ? portConfig
        : Config.succeed(Option.some(portConfig))
    )

    if (Option.isNone(portOption))
      return Layer.tap(Layer.empty, () =>
        Effect.log('Health server not running because port is not set')
      )
    const port = portOption.value

    const HealtServerLive = NodeHttpServer.layer(() => createServer(), {
      port,
    })

    const HealthHttpLive = HttpRouter.empty.pipe(
      HttpRouter.get(
        '*',
        Effect.succeed(HttpServerResponse.text('ok', {status: 200}))
      )
    )

    const HealthAppLive = HealthHttpLive.pipe(
      HttpServer.serve(),
      Layer.provide(HealtServerLive),
      Layer.tap(() => Effect.log(`Health server running on port ${port}`))
    )

    return HealthAppLive
  }).pipe(Layer.unwrapEffect)
}
