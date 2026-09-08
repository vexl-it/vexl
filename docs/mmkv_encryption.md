# MMKV encryption at rest

The mobile app keeps local state in two MMKV instances:

| Instance       | Content                                                                                     | Encryption                                  |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `mmkv.default` | The few keys needed before login: preferences, login-flow counters, deep links, diagnostics | none                                        |
| `mmkv.user`    | Everything else: chats, offers, contacts, clubs, notification key material, ...             | AES-256 with a key derived from the session |

Which keys stay in `mmkv.default` is the closed list `PlaintextMmkvKey` next
to the migration in `apps/mobile/src/utils/mmkv/userMmkvStorage.ts`. Atoms opt into it with
`atomWithParsedPlaintextMmkvStorage`; the default `atomWithParsedMmkvStorage`
writes to the user store.

## Key

The user store key is `sha256("vexl-user-mmkv-v1:" + privateKeyPemBase64)`,
base64, truncated to the 32 single-byte characters MMKV accepts. The session
private key already lives in SecureStore with
`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so the store is readable exactly when
the session is: in the foreground, in background tasks and in notification
tasks after the first unlock, and never on a device that lacks the keychain
item (for example a backup restored elsewhere). No second secret is stored.

## Lifecycle

`storage` (the `EffectMmkv` every user-data atom uses) routes through
`SessionBoundMmkvStore`. Until a session is known it delegates to an in-memory
placeholder, so atoms created at import time read defaults.
`bindUserMmkvStorage(session)` opens the encrypted instance, migrates legacy
plaintext entries, copies over anything written to the placeholder (the login
flow writes before the session is set) and notifies listeners for every stored
key so mounted atoms re-read. It runs in:

- `loadSession`, right after the session is read from storage and before the
  V1 to V2 upgrade. All entry points (splash screen, background task,
  notification handler) go through it.
- the `sessionAtom` login path.

`deleteUserMmkvStorage()` detaches `storage` and removes the instance files.
It runs from the `sessionAtom` logout path and from
`clearMmkvStorageAndEmptyAtoms`, which the login flow and account deletion
call.

## Migration from the plaintext store

Existing installs have every key in `mmkv.default`. On the first bind after
the update, every key that is not in `PlaintextMmkvKey` is copied into the
user store and removed from `mmkv.default`. Values pass through JavaScript
(strings and booleans are the only types the app stores). The copy runs before
any atom can write, and a kill in the middle simply reruns it on the next
launch: source entries are removed only after they were written to the target.

`remove()` does not scrub the old bytes from the plaintext file. Encryption
protects copies of the app container taken after migration; it is not a
forensic wipe of what was written before.

## Diagnostics

`detectMmkvDataLoss` runs after the bind in `loadSession`; see
`mmkv_data_loss_sentry_guide.md`.
