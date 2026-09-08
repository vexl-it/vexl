import {requireNativeModule} from 'expo-modules-core'
import {Platform} from 'react-native'

interface IosBackupExclusionNativeModule {
  readonly excludeDirectoryFromBackup: (uri: string) => void
}

/**
 * Sets `NSURLIsExcludedFromBackupKey` on the directory (creating it if
 * needed) so iCloud and Finder backups skip it and everything inside. The flag
 * is stored on the directory itself, so call this on every launch in case the
 * directory was recreated.
 *
 * No-op on Android: the app's Auto Backup rules include only shared
 * preferences, so files are never backed up there.
 */
export function excludeDirectoryFromBackup(uri: string): void {
  if (Platform.OS !== 'ios') return
  requireNativeModule<IosBackupExclusionNativeModule>(
    'ExpoIosBackupExclusion'
  ).excludeDirectoryFromBackup(uri)
}
