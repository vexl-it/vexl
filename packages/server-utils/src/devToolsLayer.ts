import {DevTools} from '@effect/experimental'
import {NodeSocket} from '@effect/platform-node'
import {Effect, Layer, Option, type Config, type ConfigError} from 'effect'
import {disableDevToolsInDevelopmentConfig} from './commonConfigs'

export const devToolsLayer = (
  envConfig: Config.Config<'production' | 'development' | 'test'>
): Layer.Layer<never, ConfigError.ConfigError, never> =>
  Layer.unwrapEffect(
    Effect.all([envConfig, disableDevToolsInDevelopmentConfig]).pipe(
      Effect.flatMap(([env, disableDevTools]) => {
        if (Option.getOrElse(disableDevTools, () => false)) {
          return Effect.zipRight(
            Effect.log('Dev tools disabled by config DISABLE_DEV_TOOLS = true'),
            Effect.succeed(Layer.empty)
          )
        }
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
