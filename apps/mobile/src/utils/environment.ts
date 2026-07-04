import {
  PLATFORM_ANDROID,
  PLATFORM_IOS,
} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import {getInstallationSource} from 'expo-installation-source'
import {isTestFlight} from 'expo-testflight'
import {Platform} from 'react-native'

export const enableHiddenFeatures =
  Constants.expoConfig?.extra?.enableHiddenFeatures

export const apiPreset = Constants.expoConfig?.extra?.apiPreset ?? 'stageEnv'
export const version = Schema.decodeSync(SemverString)(
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

// version, versionCode and commitHash come from the JS bundle's manifest, so
// after an OTA update they describe the bundle, not the binary. These two
// always describe the installed binary.
export const nativeVersion = Application.nativeApplicationVersion ?? 'unknown'
export const nativeBuildNumber = Application.nativeBuildVersion ?? 'unknown'

export const commitHash = String(
  Constants.expoConfig?.extra?.commitHash ?? 'local'
)
export const commitHashShort = commitHash.slice(0, 7)

export const platform =
  Platform.OS === 'android' ? PLATFORM_ANDROID : PLATFORM_IOS

const getAppSource = (): AppSource => {
  const parseAppSource = Schema.decodeSync(AppSource)
  if (Platform.OS === 'ios') {
    return parseAppSource(isTestFlight ? 'testFlight' : 'altStore')
  } else {
    return parseAppSource(getInstallationSource() ?? 'APK')
  }
}
export const appSource = getAppSource()

export const deviceModel = Device.modelName ?? undefined
export const osVersion = Device.osVersion ?? undefined
