import {NodeRuntime} from '@effect/platform-node'
import {type RunMain} from '@effect/platform/Runtime'
import {Effect, Layer, Logger} from 'effect'
import {isRunningInProductionConfig, nodeEnvConfig} from './commonConfigs'
import {devToolsLayer} from './devToolsLayer'

const logger = isRunningInProductionConfig.pipe(
  Effect.map((inProd) => (inProd ? Logger.json : Logger.pretty)),
  Layer.unwrapEffect
)

export const runMainInNode: RunMain = (effect, options) => {
  NodeRuntime.runMain(
    effect.pipe(
      Effect.catchAll((error) => Effect.logFatal('Error', error)),
      Effect.catchAllDefect((error) => Effect.logFatal('Defect', error)),
      Effect.provide(devToolsLayer(nodeEnvConfig)),
      Effect.provide(logger)
    ),
    options
  )
}
