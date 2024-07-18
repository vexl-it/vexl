import {type HttpServerRequest, type HttpServerResponse} from '@effect/platform'
import {type Default} from '@effect/platform/HttpApp'
import {type ConfigError, Effect, pipe} from 'effect'
import {Middlewares} from 'effect-http'
import {isRunningInTestConfig} from './commonConfigs'

export const setupLoggingMiddlewares = <A, B>(
  app: Default<A, B>
): Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  A | ConfigError.ConfigError,
  B | HttpServerRequest.HttpServerRequest
> =>
  Effect.flatMap(app, (app) =>
    isRunningInTestConfig.pipe(
      Effect.flatMap((isRunningInTestConfig) => {
        if (!isRunningInTestConfig)
          return pipe(app, Middlewares.accessLog(), Middlewares.errorLog)
        return app
      })
    )
  )
