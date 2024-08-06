import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {type ServeError} from '@effect/platform/HttpServerError'
import {Effect, Layer, type Config, type ConfigError, type Option} from 'effect'
import {createServer} from 'http'

export const makeInternalServer = <E, R>(
  Router: HttpRouter.HttpRouter<E, R>,
  args: {
    port: Config.Config<Option.Option<number>>
  }
): Layer.Layer<never, ConfigError.ConfigError | ServeError, R> =>
  Effect.gen(function* (_) {
    const port = yield* _(args.port, Effect.flatten)

    const InternalServerLive = NodeHttpServer.layer(() => createServer(), {
      port,
    })

    return Router.pipe(
      HttpRouter.catchAll((e) =>
        Effect.gen(function* (_) {
          const request = yield* _(HttpServerRequest.HttpServerRequest)
          yield* _(Effect.logError('Error on internal server', e, request))
          return yield* _(
            HttpServerResponse.json(
              {message: 'Internal server errror', error: e},
              {status: 500}
            )
          )
        })
      ),
      HttpMiddleware.logger,
      HttpServer.serve(),
      Layer.provide(InternalServerLive),
      Layer.tap(() => Effect.logInfo(`Internal server running on ${port}`)),
      Layer.provide(Layer.span('Internal server', {attributes: {port}}))
    )
  }).pipe(
    Effect.catchTag('NoSuchElementException', () =>
      Effect.zipRight(
        Effect.logInfo(
          'Internal server not running. No port for internal server specified.'
        ),
        Effect.succeed(Layer.empty)
      )
    ),
    Layer.unwrapEffect
  )
