import {NodeHttpServer} from '@effect/platform-node'
import {Effect, Layer} from 'effect/index'
import {createServer} from 'http'
import {
  headersTimeoutMsConfig,
  keepAliveTimeoutMsConfig,
  portConfig,
  requestTimeoutMsConfig,
} from './commonConfigs'

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
