import {Option, pipe, Schema} from 'effect'
import {useCallback, useEffect, useState} from 'react'
import {
  AppAnimationConfig,
  defaultConfig,
} from '../../demos/appAnimation/config'

const storageKey = 'vexl-showcase.app-animation-config'

const decodeStored = Schema.decodeUnknownOption(
  Schema.parseJson(AppAnimationConfig)
)

function readStoredConfig(): AppAnimationConfig {
  return pipe(
    Option.fromNullable(localStorage.getItem(storageKey)),
    Option.flatMap(decodeStored),
    Option.getOrElse(() => defaultConfig)
  )
}

/** The animation config, kept in localStorage across visits. */
export function useStoredConfig(): readonly [
  config: AppAnimationConfig,
  setConfig: (config: AppAnimationConfig) => void,
  reset: () => void,
] {
  const [config, setConfig] = useState(readStoredConfig)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(config))
  }, [config])

  const reset = useCallback(() => {
    setConfig(defaultConfig)
  }, [])

  return [config, setConfig, reset]
}
