# Device-local data and OS backups

Chats, offers, contacts, club keys and chat images exist only on the device.
The session secret that would make them usable lives in the keychain /
keystore as `THIS_DEVICE_ONLY`, so a backup restored to another device lands
the user logged out with data it cannot use. Backing that data up therefore
only creates plaintext copies outside the device. The app keeps it out of
backups on both platforms.

## Android

Expo's config plugin for `expo-secure-store` sets the app's Auto Backup rules
(`fullBackupContent` for API 30 and lower, `dataExtractionRules` for API 31
and higher, both cloud backup and device transfer). Those rules include only
the `sharedpref` domain and exclude SecureStore's own preferences. Files and
databases are never backed up, which covers MMKV (`files/mmkv`), chat images
and AsyncStorage.

This holds as long as no other plugin sets its own backup rules; the
expo-secure-store plugin warns at prebuild if one does. If custom rules are
ever added they must keep the `file` and `database` domains excluded.

## iOS

The Documents directory is included in iCloud and Finder backups by default,
and the exclusion is a per-directory file attribute, not a plist setting.
`apps/mobile/src/utils/setupBackupExclusion.ts` runs at app start (all entry
points go through `index.js`) and marks these Documents subdirectories with
`NSURLIsExcludedFromBackupKey` through the local
`@vexl-next/expo-ios-backup-exclusion` module:

| Directory        | Content                                       |
| ---------------- | --------------------------------------------- |
| `mmkv`           | all MMKV instances (chats, offers, contacts…) |
| `chat-images`    | images exchanged in chats                     |
| `profilePicture` | the user's own avatar                         |

The directories are created if missing so the attribute has something to
stick to; MMKV keeps using the directory afterwards. The attribute persists
across launches, but it is re-applied on every launch because a reinstall or
an interrupted migration can recreate a directory without it.

AsyncStorage holds the AES-encrypted session blob and small diagnostics. It
stays in backups: without the keychain secret the blob is unreadable, and
excluding `Library/Application Support` wholesale would also drop
unrelated framework state.

## What this does not cover

Data Protection already encrypts the app container on a locked device until
first unlock on both platforms, which is the same window in which the session
secret is available. Excluding backups does not protect against an attacker
with access to a running, unlocked or rooted device.
