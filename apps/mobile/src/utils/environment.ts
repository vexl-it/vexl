import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import Constants from 'expo-constants'

// export const enableHiddenFeatures =
//   Constants.expoConfig?.extra?.enableHiddenFeatures === true

export const enableHiddenFeatures =
  Constants.expoConfig?.extra?.enableHiddenFeatures
export const apiPreset = Constants.expoConfig?.extra?.apiPreset ?? 'stageEnv'
export const version = SemverString.parse(
  Constants.expoConfig?.extra?.semver ?? '0.0.0'
)
export const versionCode = Number(Constants.expoConfig?.extra?.versionCode ?? 0)
export const hmacPassword = String(
  Constants.expoConfig?.extra?.hmacPassword ??
    'UHQyykWs4nE1Yn8IQi/lsz2QemK3zA+JIWdGll3PEtle9/aMMBvQk6kKgYkjyewTiK0ypuquBSBVJwuSiYs8FQ=='
)

export const packageName = String(
  Constants.expoConfig?.extra?.packageName ?? 'it.vexl.next'
)

export const isStaging = apiPreset === 'stageEnv'
export const isProd = apiPreset === 'prodEnv'

export const commitHash = String(
  Constants.expoConfig?.extra?.commitHash ?? 'local'
)
