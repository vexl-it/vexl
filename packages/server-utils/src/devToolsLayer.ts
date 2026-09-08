import * as NodeSocket from '@effect/platform-node/NodeSocket'
import {Effect, Layer, Option, type Config} from 'effect'
import {DevTools} from 'effect/unstable/devtools'
import {disableDevToolsInDevelopmentConfig} from './commonConfigs'

export const devToolsLayer = (
  envConfig: Config.Config<'production' | 'development' | 'test'>
): Layer.Layer<never, Config.ConfigError, never> =>
  Layer.unwrap(
    Effect.all([envConfig, disableDevToolsInDevelopmentConfig]).pipe(
      Effect.flatMap(([env, disableDevTools]) => {
        if (Option.getOrElse(disableDevTools, () => false)) {
          return Effect.andThen(
            Effect.log('Dev tools disabled by config DISABLE_DEV_TOOLS = true'),
            Effect.succeed(Layer.empty)
          )
        }
        if (env === 'development') {
          return Effect.andThen(
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
          return Effect.andThen(
            Effect.log(
              'I am NOT in development environment, NOT registering dev tools'
            ),
            Effect.succeed(Layer.empty)
          )
        }
      })
    )
  )
