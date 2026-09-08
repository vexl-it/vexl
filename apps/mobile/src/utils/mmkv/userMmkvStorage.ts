import {createHash} from 'crypto'
import {Array, pipe, Schema} from 'effect'
import {createMMKV, deleteMMKV} from 'react-native-mmkv'
import {type Session} from '../../brands/Session.brand'
import {plaintextStorage, USER_MMKV_ID, userMmkvStore} from './effectMmkv'
import {copyMmkvEntries, type MmkvStore} from './mmkvStore'

// MMKV wants the AES-256 key as 32 single-byte characters. Hashing the session
// private key with a purpose tag binds the store to the user's identity while
// keeping the identity key itself out of MMKV.
function deriveUserMmkvKey(session: Pick<Session, 'privateKey'>): string {
  return createHash('sha256')
    .update(`vexl-user-mmkv-v1:${session.privateKey.privateKeyPemBase64}`)
    .digest('base64')
    .slice(0, 32)
}

/**
 * Keys that must be readable before anyone is logged in (preferences read by
 * the login screens, login-flow counters, deep links, diagnostics). Everything
 * else is user data and lives in the encrypted store.
 *
 * The migration below decides by this list alone which entries to move out of
 * the plaintext instance, so a plaintext atom for a key missing here would
 * lose its value on the first launch after the update. That is why
 * `atomWithParsedPlaintextMmkvStorage` only accepts keys from this list.
 */
export const PlaintextMmkvKey = Schema.Literal(
  'preferences',
  'previewChannel',
  'numberOfLoginAttempts',
  'lastInitialLink',
  'lastUniversalOrAppLink',
  'cancelledIds',
  'actionsBenchmarks',
  'session:v2SecretWasWritten',
  'logs',
  'logs_enabled',
  'notificationToken'
)
export type PlaintextMmkvKey = typeof PlaintextMmkvKey.Type
const isPlaintextMmkvKey = Schema.is(PlaintextMmkvKey)

// Before storage was encrypted every key lived in the plaintext instance.
// Moves the user's entries over on the first bind after the update.
function migrateLegacyPlaintextEntries(target: MmkvStore): void {
  const legacy = plaintextStorage._storage
  const legacyKeys = pipe(
    legacy.getAllKeys(),
    Array.filter((key) => !isPlaintextMmkvKey(key))
  )
  if (!Array.isNonEmptyArray(legacyKeys)) return

  copyMmkvEntries(legacy, target, legacyKeys)
  for (const key of legacyKeys) legacy.remove(key)
}

let boundPublicKey: string | undefined

/**
 * Opens the encrypted store for the given session and routes `storage` to it.
 * Idempotent for the same session. Must run wherever a session becomes
 * available: session load (foreground, background task, notification task)
 * and login.
 */
export function bindUserMmkvStorage(
  session: Pick<Session, 'privateKey'>
): void {
  const publicKey = session.privateKey.publicKeyPemBase64
  if (boundPublicKey === publicKey) return
  if (boundPublicKey !== undefined) deleteUserMmkvStorage()

  const store = createMMKV({
    id: USER_MMKV_ID,
    encryptionKey: deriveUserMmkvKey(session),
    encryptionType: 'AES-256',
    recoveryStrategy: 'recover-on-error',
  })
  migrateLegacyPlaintextEntries(store)
  userMmkvStore.bind(store)
  boundPublicKey = publicKey
}

/** Detaches `storage` from the user's store and removes its files. */
export function deleteUserMmkvStorage(): void {
  userMmkvStore.unbind()
  boundPublicKey = undefined
  deleteMMKV(USER_MMKV_ID)
}
