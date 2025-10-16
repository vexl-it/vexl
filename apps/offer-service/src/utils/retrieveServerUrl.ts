import {ENV_PRESETS} from '@vexl-next/rest-api'
import {Effect} from 'effect'
import {type ConfigError} from 'effect/ConfigError'
import {nodeEnvConfig} from '../configs'

export function retrieveServerUrl(): Effect.Effect<string, ConfigError> {
  return Effect.gen(function* (_) {
    const env = yield* _(nodeEnvConfig)
    return env === 'production'
      ? ENV_PRESETS.prodEnv.offerMs
      : ENV_PRESETS.stageEnv.offerMs
  })
}
