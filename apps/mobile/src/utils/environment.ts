import Constants from 'expo-constants'

// export const enableHiddenFeatures =
//   Constants.expoConfig?.extra?.enableHiddenFeatures === true
export const enableHiddenFeatures = false
export const apiPreset = String(Constants.expoConfig?.extra?.apiPreset)
export const version = String(Constants.expoConfig?.extra?.version ?? 'local')
