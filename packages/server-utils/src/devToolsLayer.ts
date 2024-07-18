import {DevTools} from '@effect/experimental'
import {NodeSocket} from '@effect/platform-node'
import {type Config, type ConfigError, Effect, Layer} from 'effect'

export const devToolsLayer = (
  envConfig: Config.Config<'production' | 'development' | 'test'>
): Layer.Layer<never, ConfigError.ConfigError, never> =>
  Layer.unwrapEffect(
    envConfig.pipe(
      Effect.flatMap((env) => {
        if (env === 'development') {
          return Effect.zipRight(
            Effect.log(
              'I am in development environment, registering dev tools'
            ),
            Effect.succeed(
              DevTools.layerWebSocket().pipe(
                Layer.provide(NodeSocket.layerWebSocketConstructor)
              )
            )
          )
        } else {
          return Effect.zipRight(
            Effect.log(
              'I am NOT in development environment, NOT registering dev tools'
            ),
            Effect.succeed(Layer.empty)
          )
        }
      })
    )
  )
