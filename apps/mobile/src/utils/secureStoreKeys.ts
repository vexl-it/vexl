import * as SecureStore from 'expo-secure-store'

// Every SecureStore item the app owns. Kept in a leaf module so the MMKV
// storage layer can check whether a session secret exists without importing
// session code (which itself depends on MMKV).
export const SECRET_TOKEN_KEY = 'secretToken'
export const SECRET_TOKEN_KEY_V2 = 'secretToken_V2'
export const MMKV_ENCRYPTION_KEY = 'mmkvEncryptionKey_V1'

export const DEVICE_BOUND_SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions =
  {
    // THIS_DEVICE_ONLY keeps the secret out of iCloud Keychain / encrypted
    // backups: the key that decrypts the user's identity never leaves the device.
    // AFTER_FIRST_UNLOCK (vs WHEN_UNLOCKED) keeps it readable for background
    // launches that happen before the first unlock.
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  }
