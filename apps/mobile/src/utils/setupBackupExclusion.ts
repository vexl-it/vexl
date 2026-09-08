import {excludeDirectoryFromBackup} from '@vexl-next/expo-ios-backup-exclusion'
import {Directory, Paths} from 'expo-file-system'
import {IMAGES_DIRECTORY, PROFILE_PICTURE_DIRECTORY} from './fsDirectories'
import reportError from './reportError'

// MMKV (chats, offers, contacts, clubs, ...) and chat images are device-local.
// A backup restored to another device could not use them anyway: the session
// secret is THIS_DEVICE_ONLY, so the user lands logged out. Keeping them out
// of backups means they never leave the device in plaintext.
const DEVICE_LOCAL_DIRECTORIES = [
  'mmkv',
  IMAGES_DIRECTORY,
  PROFILE_PICTURE_DIRECTORY,
]

for (const directory of DEVICE_LOCAL_DIRECTORIES) {
  try {
    excludeDirectoryFromBackup(new Directory(Paths.document, directory).uri)
  } catch (e) {
    reportError(
      'error',
      new Error(`Could not exclude ${directory} from backup`, {cause: e})
    )
  }
}
