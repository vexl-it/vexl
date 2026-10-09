import {
  HttpApiBuilder,
  HttpMiddleware,
  HttpServer,
  type HttpApi,
  type HttpRouter,
} from '@effect/platform'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {type ServeError} from '@effect/platform/HttpServerError'
import {Effect, Layer, type Config, type ConfigError, type Option} from 'effect'
import {createServer} from 'http'

/**
 * Serves an internal `HttpApi` on `serverLayer`, keeping the server layer's
 * outputs (e.g. a test HttpClient) available to the caller.
 */
export const serveInternalApi = <E, R, A, SE, SR>(
  apiLive: Layer.Layer<HttpApi.Api, E, R>,
  serverLayer: Layer.Layer<A, SE, SR>
): Layer.Layer<
  A,
  E | SE,
  | SR
  | Exclude<
      R | HttpServer.HttpServer | HttpRouter.HttpRouter.DefaultServices,
      A
    >
> =>
  HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
    Layer.provide(apiLive),
    HttpServer.withLogAddress,
    Layer.provideMerge(serverLayer),
    // HttpApiBuilder registers every group into one shared router layer.
    // Building fresh gives this server its own router, so internal routes
    // never end up on the public server.
    Layer.fresh
  )

/**
 * Serves an `HttpApi` on the internal port, which is reachable only from inside
 * the cluster. Never expose the internal port through an ingress.
 */
export const makeInternalApiServer = <E, R>(
  apiLive: Layer.Layer<HttpApi.Api, E, R>,
  args: {
    port: Config.Config<Option.Option<number>>
  }
): Layer.Layer<never, E | ConfigError.ConfigError | ServeError, R> =>
  Effect.gen(function* (_) {
    const port = yield* _(args.port, Effect.flatten)

    return serveInternalApi(
      apiLive,
      NodeHttpServer.layer(createServer, {port})
    ).pipe(Layer.discard)
  }).pipe(
    Effect.catchTag('NoSuchElementException', () =>
      Effect.zipRight(
        Effect.logWarning(
          'Internal server not running. No port for internal server specified.'
        ),
        Effect.succeed(Layer.empty)
      )
    ),
    Layer.unwrapEffect
  )
