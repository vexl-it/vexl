import Constants from 'expo-constants'

// export const enableHiddenFeatures =
//   Constants.expoConfig?.extra?.enableHiddenFeatures === true

export const enableHiddenFeatures =
  Constants.expoConfig?.extra?.enableHiddenFeatures
export const apiPreset = Constants.expoConfig?.extra?.apiPreset ?? 'stageEnv'
export const version = String(Constants.expoConfig?.extra?.version ?? 'local')
export const versionCode = Number(Constants.expoConfig?.extra?.versionCode ?? 0)
export const hmacPassword = String(
  Constants.expoConfig?.extra?.hmacPassword ??
    'UHQyykWs4nE1Yn8IQi/lsz2QemK3zA+JIWdGll3PEtle9/aMMBvQk6kKgYkjyewTiK0ypuquBSBVJwuSiYs8FQ=='
)

export const packageName = String(
  Constants.expoConfig?.extra?.packageName ?? 'it.vexl.next'
)

export const isStaging = apiPreset === 'stageEnv'
