import Constants from 'expo-constants'

// export const enableHiddenFeatures =
//   Constants.expoConfig?.extra?.enableHiddenFeatures === true

export const enableHiddenFeatures =
  Constants.expoConfig?.extra?.enableHiddenFeatures
export const apiPreset = Constants.expoConfig?.extra?.apiPreset ?? 'stageEnv'
export const version = String(Constants.expoConfig?.extra?.version ?? 'local')
export const versionCode = Number(Constants.expoConfig?.extra?.versionCode ?? 0)
