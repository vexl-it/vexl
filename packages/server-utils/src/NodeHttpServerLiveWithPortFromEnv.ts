import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {Context, Effect, Layer} from 'effect'
import {createServer, type Server} from 'http'
import {
  headersTimeoutMsConfig,
  keepAliveTimeoutMsConfig,
  portConfig,
  requestTimeoutMsConfig,
} from './commonConfigs'

export class HttpServerInstance extends Context.Service<
  HttpServerInstance,
  Server
>()('HttpServerInstance') {}

export const NodeHttpServerLiveWithPortFromEnv = Effect.gen(function* () {
  const port = yield* portConfig
  const keepAliveTimeoutMs = yield* keepAliveTimeoutMsConfig
  const headersTimeoutMs = yield* headersTimeoutMsConfig
  const requestTimeoutMs = yield* requestTimeoutMsConfig

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
}).pipe(Layer.unwrap)
