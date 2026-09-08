# expo-ios-backup-exclusion

One function, `excludeDirectoryFromBackup(uri)`, that marks a directory with
`NSURLIsExcludedFromBackupKey` on iOS. Android is a no-op because the app's
backup rules (from expo-secure-store) already include only shared preferences.

Why the app uses it: see `docs/mobile_local_data_backups.md`.
