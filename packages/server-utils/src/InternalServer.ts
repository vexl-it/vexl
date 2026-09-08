import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {Effect, Layer, Option, type Config} from 'effect'
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from 'effect/unstable/http'
import {createServer} from 'http'

export const makeInternalServer = <A, E, R>(
  routes: Layer.Layer<A, E, R>,
  args: {
    port: Config.Config<Option.Option<number>>
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve the router's inferred request service requirements.
) =>
  Effect.gen(function* () {
    const port = yield* args.port
    if (Option.isNone(port)) {
      yield* Effect.logInfo(
        'Internal server not running. No port for internal server specified.'
      )
      return Layer.empty
    }
    return HttpRouter.serve(routes, {
      middleware: Effect.catch((error) =>
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          yield* Effect.logError('Error on internal server', error, {
            method: request.method,
            url: request.url,
          })
          return yield* HttpServerResponse.json(
            {message: 'Internal server error'},
            {status: 500}
          )
        })
      ),
    }).pipe(
      Layer.provide(
        NodeHttpServer.layer(() => createServer(), {port: port.value})
      ),
      Layer.tap(() =>
        Effect.logInfo(`Internal server running on ${port.value}`)
      ),
      Layer.provide(
        Layer.span('Internal server', {attributes: {port: port.value}})
      )
    )
  }).pipe(Layer.unwrap)
