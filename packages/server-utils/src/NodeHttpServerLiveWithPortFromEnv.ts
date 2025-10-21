import {NodeHttpServer} from '@effect/platform-node'
import {Effect, Layer} from 'effect/index'
import {createServer} from 'http'
import {portConfig} from './commonConfigs'

export const NodeHttpServerLiveWithPortFromEnv = portConfig.pipe(
  Effect.map((port) => NodeHttpServer.layer(createServer, {port})),
  Layer.unwrapEffect
)
