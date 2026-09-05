# MMKV encryption at rest

The mobile app keeps most device-local state in MMKV: chats, offers with
their favourite/archive marks, chat tags, contacts, club keys. Since the
encryption change these values are AES-256 encrypted on disk with a random,
per-install key that lives in the platform keychain/keystore through Expo
SecureStore. Nothing about this touches the backend.

## Key

| Property          | Value                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| SecureStore item  | `mmkvEncryptionKey_V1` (`apps/mobile/src/utils/secureStoreKeys.ts`)                     |
| Material          | 32 random symbols from a 64-symbol alphabet (192 bits), single-byte UTF-8, AES-256 mode |
| Accessibility     | `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, the same as the session secret                   |
| Lifetime          | Created on the first launch that needs it; never rotated, never deleted by the app      |
| Fingerprint       | SHA-256 of the key in `Documents/mmkv/mmkv.encrypted.key-id`, next to the ciphertext    |
| Relation to login | None. The store must work while logged out, so the key is not derived from the session  |

The key is written to SecureStore before the store is ever opened with it, so
a crash between the two can never leave ciphertext without a key.

`AFTER_FIRST_UNLOCK` keeps headless launches (background fetch, background
notification tasks) working after the device's first unlock, exactly like the
session secret. `THIS_DEVICE_ONLY` keeps the key out of iCloud Keychain and
encrypted backups. On Android, SecureStore values are encrypted with an Android
Keystore key that is not backed up either.

## Startup

MMKV must be constructed synchronously because atoms read storage at module
evaluation. SecureStore's synchronous `getItem`/`setItem` make that possible;
everything below runs in `openEncryptedMmkvStorage()` while
`apps/mobile/src/utils/mmkv/effectMmkv.ts` is evaluated.

```text
read key from SecureStore
|
+- read throws ............................ unavailable
+- no mmkv.encrypted file
|  +- key present ......................... open with it
|  +- key missing ......................... generate + store key, open
+- ciphertext exists
   +- key present and matches fingerprint . open with it
   +- key missing, or does not match
      +- session secret present .......... locked
      +- no session secret ............... delete ciphertext, generate + store key, open
|
plaintext mmkv.default present?
+- yes .................................... copy values via JS, clearAll, unlink
+- any step throws ........................ unavailable
```

The encrypted store uses its own instance id (`mmkv.encrypted`). The plaintext
store older versions wrote (`mmkv.default`) is never opened with a key and the
encrypted one is never opened without its key, so a file is never opened in a
key state it was not written in. Opening an MMKV file with the wrong key does
not fail loudly; with `recover-on-error` it silently starts over empty. That
is why the key's SHA-256 fingerprint is recorded next to the ciphertext when
the store is created: a stored key that does not match it (a container and a
keychain restored from different installs) is handled like a missing key
instead of being tried. A store without a fingerprint file trusts the key and
records it.

`compareBeforeSet` is off for the encrypted store: MMKV core refuses to
combine it with encryption and asserts on it in debug builds.

## Migration from the plaintext store

Runs on every launch while `mmkv.default` exists:

1. Open it and copy every key into the encrypted store through JS (string or
   boolean, the only types the app stores). Not MMKV's native `importAllFrom`:
   it hands an encrypted target zero-copy buffers into the source file's
   mapping, which step 2 unmaps, and the first read then crashed with
   `EXC_BAD_ACCESS` in `MMKV::getString` (found on-device).
2. `clearAll()` it. MMKV zero-fills the mapped file, so the plaintext is gone
   even if the next step fails.
3. Unlink `mmkv/mmkv.default` and `mmkv/mmkv.default.crc` (best effort).

Re-running is idempotent. The app writes nothing to the encrypted store before
the migration finishes, so a launch that died mid-way re-imports the same
values, and a launch that finds an emptied plaintext store imports nothing. Any
exception makes the launch `unavailable` (see below) rather than continuing
with a half-migrated store that a later launch would overwrite with stale
plaintext values.

Downgrading to a version that still reads `mmkv.default` after the migration
ran is not supported: that version would find an empty store.

## Failure states

| Status        | Meaning                                                                         | Behaviour                                                                                           |
| ------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ready`       | Store open and migrated                                                         | Normal operation                                                                                    |
| `locked`      | Ciphertext exists, its key is gone or mismatched, a session secret still exists | Fail closed: `loadSession` returns `MmkvStorageNotReady`, blocking recovery screen, nothing deleted |
| `unavailable` | SecureStore or MMKV threw, or the migration failed                              | Fail closed the same way; usually transient, cleared by an app restart                              |

In both failure states `storage` is a volatile in-memory placeholder so
module-level atom reads do not spam parse errors. `loadSession` refuses to load
or log out a session while the placeholder is active, so no user data is ever
routed through it, and `detectMmkvDataLoss` skips its checks (an empty
placeholder would otherwise look like a total wipe) and reports the status.

The "key missing, ciphertext present" case is the backup-restore shape:
iOS restores the Documents directory but not `THIS_DEVICE_ONLY` keychain
items; Android Auto Backup (`allowBackup` is on by default in Expo) restores
`filesDir` and the SecureStore preferences, but the Keystore key is gone, so
SecureStore returns `null`. The session secret shares the key's accessibility,
so if it is gone too, the session cannot load either and nothing reachable is
lost by discarding the ciphertext and starting over; if it survived, the user
is logged in and their local data must not silently disappear, hence `locked`.

## Logout and account switching

`clearMmkvStorageAndEmptyAtoms` still `clearAll()`s the encrypted store, and
the deferred-write generation guard still drops writes queued before the
clear. The key is not rotated on logout: the cleared store holds nothing to
protect, and rotating in place would reintroduce a crash window between
re-keying the file and storing the new key. Data written for one account can
therefore only be read by the same install's key on the same device, and only
until logout wipes it.

## What this does and does not protect

Protects against offline extraction of the app container (rooted or
jailbroken device at rest, forensic imaging) and against backups that do not
carry the device-bound key. Does not protect against an attacker who controls
the running device and can call into the keychain/keystore as the app, or read
application memory.

## Verification

`apps/mobile/src/utils/mmkv/encryptedMmkvStorage.test.ts` covers key
generation and ordering, persistence across launches, key mismatch, every
migration path including interruption and retry, and every failure state.
`loadSession.test.ts` covers the blocking behaviour, and
`detectMmkvDataLoss.test.ts` the startup status reports. The Jest mock of
`react-native-mmkv` (`apps/mobile/__mocks__`) simulates per-id files and
wrong-key opens.

Real ciphertext cannot be verified with mocks. On a device, upgrade from a
build that still writes `mmkv.default`, then confirm that `mmkv/mmkv.default`
is gone from the app container and that `strings mmkv/mmkv.encrypted` shows
none of the stored values.
