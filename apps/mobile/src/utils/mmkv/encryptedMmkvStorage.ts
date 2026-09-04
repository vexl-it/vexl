import {createHash, randomBytes} from 'crypto'
import {Array, pipe} from 'effect'
import {File, Paths} from 'expo-file-system'
import * as SecureStore from 'expo-secure-store'
import {createMMKV, deleteMMKV, existsMMKV, type MMKV} from 'react-native-mmkv'
import {
  DEVICE_BOUND_SECURE_STORE_OPTIONS,
  MMKV_ENCRYPTION_KEY,
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
} from '../secureStoreKeys'
import {InMemoryMmkvStore, type MmkvStore} from './inMemoryMmkvStore'

// Startup architecture (everything below runs synchronously at module
// evaluation, before any atom reads storage):
//
// 1. Read the encryption key from SecureStore with the synchronous API. The
//    key is a random per-install secret stored with the same device-bound,
//    after-first-unlock accessibility as the session secret, so headless
//    launches can open the store after the device's first unlock.
// 2. Open the encrypted MMKV instance. It has its own id, separate from the
//    plaintext store older app versions used, so a file is never opened with
//    a key state it was not written in.
// 3. If the plaintext store still exists, copy it into the encrypted one,
//    zero it and unlink it. Re-running after an interruption is idempotent:
//    the app never writes to the encrypted store before this step finishes.
//
// A SHA-256 fingerprint of the key sits next to the ciphertext. Opening MMKV
// with the wrong key does not fail loudly (with `recover-on-error` it starts
// over empty), so a key that does not match the fingerprint is treated
// exactly like a missing key and the file is never opened with it.
//
// Any failure fails closed: the app gets a volatile placeholder store and the
// session load blocks with the recovery screen instead of running on it.

export const ENCRYPTED_MMKV_ID = 'mmkv.encrypted'
export const LEGACY_PLAINTEXT_MMKV_ID = 'mmkv.default'

// 32 symbols from a 64-symbol alphabet: 192 bits of entropy, and every symbol
// is a single UTF-8 byte, which is what MMKV's AES-256 key length check counts.
const ENCRYPTION_KEY_LENGTH = 32
const ENCRYPTION_KEY_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export type MmkvEncryptionKeySource =
  | 'existing'
  | 'generated'
  | 'regeneratedAfterKeyLoss'
  | 'regeneratedAfterKeyMismatch'

export type MmkvStorageStatus =
  | {
      readonly _tag: 'ready'
      readonly encryptionKeySource: MmkvEncryptionKeySource
      /** `undefined` when no plaintext store was found on this launch. */
      readonly migratedPlaintextKeyCount: number | undefined
    }
  /**
   * Ciphertext exists, its key is gone from SecureStore, and a session secret
   * is still present: the user is logged in but their local data is
   * unreadable. Never resolved automatically.
   */
  | {readonly _tag: 'locked'}
  /** SecureStore or MMKV threw. Usually transient; needs an app restart. */
  | {readonly _tag: 'unavailable'; readonly cause: unknown}

export interface OpenedMmkvStorage {
  readonly store: MmkvStore
  readonly status: MmkvStorageStatus
}

export function getMmkvFiles(id: string): {dataFile: File; crcFile: File} {
  return {
    dataFile: new File(Paths.document, `mmkv/${id}`),
    crcFile: new File(Paths.document, `mmkv/${id}.crc`),
  }
}

function getKeyFingerprintFile(): File {
  return new File(Paths.document, `mmkv/${ENCRYPTED_MMKV_ID}.key-id`)
}

function encryptionKeyFingerprint(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// No fingerprint (a store created before it was recorded) trusts the key.
function matchesRecordedKeyFingerprint(key: string): boolean {
  const file = getKeyFingerprintFile()
  return (
    !file.exists || file.textSync().trim() === encryptionKeyFingerprint(key)
  )
}

function recordKeyFingerprintBestEffort(key: string): void {
  try {
    const file = getKeyFingerprintFile()
    if (file.exists) return
    file.create()
    file.write(encryptionKeyFingerprint(key))
  } catch {}
}

function generateEncryptionKey(): string {
  return pipe(
    Array.fromIterable(randomBytes(ENCRYPTION_KEY_LENGTH)),
    Array.map((byte) =>
      ENCRYPTION_KEY_ALPHABET.charAt(byte % ENCRYPTION_KEY_ALPHABET.length)
    ),
    Array.join('')
  )
}

// The key must be durably stored before the store is ever opened with it,
// otherwise a crash in between would leave ciphertext without a key.
function storeNewEncryptionKey(): string {
  const key = generateEncryptionKey()
  SecureStore.setItem(
    MMKV_ENCRYPTION_KEY,
    key,
    DEVICE_BOUND_SECURE_STORE_OPTIONS
  )
  return key
}

function hasStoredSessionSecret(): boolean {
  return (
    SecureStore.getItem(SECRET_TOKEN_KEY_V2) !== null ||
    SecureStore.getItem(SECRET_TOKEN_KEY) !== null
  )
}

function resolveEncryptionKey():
  | {readonly key: string; readonly source: MmkvEncryptionKeySource}
  | 'locked' {
  const storedKey = SecureStore.getItem(MMKV_ENCRYPTION_KEY)

  if (!existsMMKV(ENCRYPTED_MMKV_ID)) {
    return storedKey !== null
      ? {key: storedKey, source: 'existing'}
      : {key: storeNewEncryptionKey(), source: 'generated'}
  }

  if (storedKey !== null && matchesRecordedKeyFingerprint(storedKey))
    return {key: storedKey, source: 'existing'}

  // Ciphertext whose key is gone (a backup restored onto another device, a
  // wiped keychain) or belongs to a different store (mixed restore). The
  // session secret shares the key's accessibility, so if it survived the
  // user is logged in and must not lose their data silently.
  if (hasStoredSessionSecret()) return 'locked'

  // Without a session secret the session cannot load either, so nothing
  // reachable is lost by starting over.
  if (!deleteMMKV(ENCRYPTED_MMKV_ID))
    throw new Error('Could not delete unreadable encrypted MMKV storage')
  deleteFileBestEffort(getKeyFingerprintFile())
  return {
    key: storeNewEncryptionKey(),
    source:
      storedKey === null
        ? 'regeneratedAfterKeyLoss'
        : 'regeneratedAfterKeyMismatch',
  }
}

function deleteFileBestEffort(file: File): void {
  try {
    if (file.exists) file.delete()
  } catch {}
}

function deleteMmkvFilesBestEffort(id: string): void {
  try {
    const {dataFile, crcFile} = getMmkvFiles(id)
    deleteFileBestEffort(dataFile)
    deleteFileBestEffort(crcFile)
  } catch {}
}

// Values pass through JS on purpose. MMKV's native `importAllFrom` hands an
// encrypted target zero-copy buffers that point into the source file's
// mapping, and clearing the source below unmaps it, so the first read of an
// imported value crashed with EXC_BAD_ACCESS. Strings and booleans are the
// only value types the app stores.
function copyLegacyValues(legacy: MMKV, encrypted: MMKV): number {
  return pipe(
    legacy.getAllKeys(),
    Array.filter((key) => {
      const value = legacy.getString(key) ?? legacy.getBoolean(key)
      if (value === undefined) return false
      encrypted.set(key, value)
      return true
    }),
    Array.length
  )
}

function migrateLegacyPlaintextStorage(encrypted: MMKV): number | undefined {
  if (!existsMMKV(LEGACY_PLAINTEXT_MMKV_ID)) return undefined

  const legacy = createMMKV({
    id: LEGACY_PLAINTEXT_MMKV_ID,
    recoveryStrategy: 'recover-on-error',
  })
  const importedKeyCount = copyLegacyValues(legacy, encrypted)
  // clearAll zero-fills the mapped file, so the plaintext is gone even when
  // the unlink below fails; a later launch then just finds an empty store.
  legacy.clearAll()
  deleteMmkvFilesBestEffort(LEGACY_PLAINTEXT_MMKV_ID)
  return importedKeyCount
}

export function openEncryptedMmkvStorage(): OpenedMmkvStorage {
  try {
    const resolvedKey = resolveEncryptionKey()
    if (resolvedKey === 'locked')
      return {store: new InMemoryMmkvStore(), status: {_tag: 'locked'}}

    const encrypted = createMMKV({
      id: ENCRYPTED_MMKV_ID,
      encryptionKey: resolvedKey.key,
      encryptionType: 'AES-256',
      recoveryStrategy: 'recover-on-error',
      // compareBeforeSet is deliberately off: MMKV core refuses (and asserts
      // in debug builds) to combine it with encryption.
    })
    recordKeyFingerprintBestEffort(resolvedKey.key)
    const migratedPlaintextKeyCount = migrateLegacyPlaintextStorage(encrypted)

    return {
      store: encrypted,
      status: {
        _tag: 'ready',
        encryptionKeySource: resolvedKey.source,
        migratedPlaintextKeyCount,
      },
    }
  } catch (cause) {
    return {
      store: new InMemoryMmkvStore(),
      status: {_tag: 'unavailable', cause},
    }
  }
}
