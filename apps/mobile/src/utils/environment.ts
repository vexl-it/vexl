import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'
import Constants from 'expo-constants'
import {getInstallationSource} from 'expo-installation-source'
import {isTestFlight} from 'expo-testflight'
import {Platform} from 'react-native'

export const enableHiddenFeatures =
  Constants.expoConfig?.extra?.enableHiddenFeatures

export const apiPreset = Constants.expoConfig?.extra?.apiPreset ?? 'stageEnv'
export const version = SemverString.parse(
  Constants.expoConfig?.extra?.semver ?? '0.0.0'
)

// NEver import @effect/schema here or it will break typecheck (Reason is unknown but you are welcome to try)
export const versionCode = Number(
  Constants.expoConfig?.extra?.versionCode ?? 0
) as VersionCode

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

const getAppSource = (): AppSource => {
  const parseAppSource = Schema.decodeSync(AppSource)
  if (Platform.OS === 'ios') {
    return parseAppSource(isTestFlight ? 'testFlight' : 'altStore')
  } else {
    return parseAppSource(getInstallationSource() ?? 'APK')
  }
}
export const appSource = getAppSource()
