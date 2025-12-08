import {NodeHttpServer} from '@effect/platform-node'
import {Context, Effect, Layer} from 'effect/index'
import {createServer, type Server} from 'http'
import {
  headersTimeoutMsConfig,
  keepAliveTimeoutMsConfig,
  portConfig,
  requestTimeoutMsConfig,
} from './commonConfigs'

export class HttpServerInstance extends Context.Tag('HttpServerInstance')<
  HttpServerInstance,
  Server
>() {}

export const NodeHttpServerLiveWithPortFromEnv = Effect.gen(function* (_) {
  const port = yield* _(portConfig)
  const keepAliveTimeoutMs = yield* _(keepAliveTimeoutMsConfig)
  const headersTimeoutMs = yield* _(headersTimeoutMsConfig)
  const requestTimeoutMs = yield* _(requestTimeoutMsConfig)

  return NodeHttpServer.layer(
    () => {
      const server = createServer()
      server.keepAliveTimeout = keepAliveTimeoutMs
      server.headersTimeout = headersTimeoutMs
      server.requestTimeout = requestTimeoutMs

      return server
    },
    {port}
  )
}).pipe(Layer.unwrapEffect)
