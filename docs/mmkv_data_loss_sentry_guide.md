# Diagnosing MMKV data loss from Sentry logs

This guide covers the MMKV recovery, durability, and temporary diagnostics used
by the mobile app. The reports distinguish three failure modes:

1. MMKV cannot recover any entries after a CRC or file-length error.
2. MMKV recovers an incomplete prefix of the file, so some keys disappear.
3. A stored value remains present but no longer matches its Effect Schema.

> **Privacy note:** Reports contain key names and storage metadata, never stored
> values. Parse reports include only the error tag, raw value length, and whether
> the raw value is valid JSON. The rejected value and full `ParseError` are not
> sent. The AsyncStorage presence record also stores key names only.

## Recovery and durability model

The app uses react-native-mmkv v4 with `recoveryStrategy: 'recover-on-error'`
on an encrypted instance (`mmkv.encrypted`, see `mmkv_encryption.md`).
This maps to MMKV's `OnErrorRecover` behavior for CRC and file-length errors.
Recovery is best effort, not transactional repair. MMKV can greedily retain the
readable prefix before a damaged region and rewrite that subset as a valid
store. Keys encoded later in the file can therefore disappear even though MMKV
opens successfully and still contains other keys. The partial-loss diagnostic
exists for this case.

This differs from the old v3 behavior that discarded the store on such an
error. A completely unrecoverable file can still produce an empty store, so the
total-wipe diagnostic remains useful.

MMKV atom writes are normally coalesced and deferred until an idle callback,
bounded by a one-second timeout. Background entry points synchronously flush
all pending atom writes in a `finally` block before returning control to the
operating system:

- the Expo background fetch task;
- the background notification handler.

On iOS, chat-notification cancellation is awaited before the task settles. Any
state it queues is therefore present before the final flush runs. A task failure
still runs the flush. Pending writes invalidated by an intentional storage clear
are discarded instead of being flushed.

## Code locations

| File                                                                       | Responsibility                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/utils/mmkv/effectMmkv.ts`                                 | Wraps the opened store and exposes its startup status                                                         |
| `apps/mobile/src/utils/mmkv/encryptedMmkvStorage.ts`                       | Opens the encrypted v4 instance with `recover-on-error`, migrates the plaintext store; see mmkv_encryption.md |
| `apps/mobile/src/utils/mmkv/detectMmkvDataLoss.ts`                         | Detects total and partial loss and gathers MMKV file metadata                                                 |
| `apps/mobile/src/utils/mmkv/criticalMmkvKeys.ts`                           | Defines the critical keys and the key-name-only presence record schema                                        |
| `apps/mobile/src/utils/mmkv/mmkvDataLossDiagnosticStorage.ts`              | Serializes presence-record updates, startup detection, and intentional clears                                 |
| `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts`             | Reports parse failures, records successful critical-key writes, defers writes, and exposes the final flush    |
| `apps/mobile/src/utils/clearMmkvStorageAndEmptyAtoms.ts`                   | Clears MMKV immediately, resets mounted atoms, and prevents writes from surviving an intentional clear        |
| `apps/mobile/src/utils/backgroundTask/processBackgroundTask.ts`            | Flushes pending MMKV writes before a background fetch finishes                                                |
| `apps/mobile/src/utils/notifications/notificationReceivedHandler/index.ts` | Flushes pending MMKV writes before a background notification task finishes                                    |

## Critical keys

Partial-loss detection tracks whether these keys were present on the previous
successful launch or after a successful persist:

- `messagingState`
- `offers`
- `storedContacts`
- `connectionsStateV2`
- `offer-to-connections`
- `postLoginFlowProgress1`
- `storedClubsV2`
- `fcmCypherToKeyHolder`
- `vexlTokenToKeyHolder`

The last three include club and notification key-holder maps. Their values are
not copied to AsyncStorage or Sentry. Only their key names are recorded.

## Message catalog

### Error level

| Message                                                                           | Emitted when                                                                                              | Extra fields                                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `MMKV data loss detected: data was previously stored but MMKV is now empty`       | The MMKV sentinel is absent, the AsyncStorage populated sentinel exists, and MMKV has no remaining keys   | `lastPopulatedAt`, `remainingKeyCount`, `appState`, data and CRC file existence and sizes      |
| `MMKV partial data loss detected: critical keys disappeared since last launch`    | At least one previously recorded critical key is absent while MMKV is not classified as a total wipe      | `disappearedKeys`, `remainingKeyCount`, `appState`, data and CRC file existence and sizes      |
| `Error while parsing stored value. Using provided default. Key: <KEY>`            | A critical key exists but its startup value cannot be read or decoded                                     | `key`, `errorTag`, and, when raw text was readable, `rawValueLength` and `rawValueIsValidJson` |
| `Error while parsing stored mmkv value in onChange function. Key: '<KEY>'`        | A changed critical key cannot be read or decoded                                                          | Same parse metadata as the startup report                                                      |
| `MMKV storage is locked: encryption key is missing while a session secret exists` | The encrypted store's key is gone from SecureStore but a session secret survived (see mmkv_encryption.md) | `appState`, data and CRC file existence and sizes                                              |
| `MMKV storage is unavailable`                                                     | SecureStore or MMKV threw while opening or migrating the store; the error is attached as `cause`          | `appState`, data and CRC file existence and sizes                                              |

### Warning level

The two per-key parse messages above are warnings for non-critical keys. The
following messages are always warnings:

| Message                                                                                                    | Emitted when                                                                          | Extra fields                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `MMKV atom initialization summary`                                                                         | Five seconds after atom initialization begins, if at least one atom had a parse error | `loaded`, `valueNotSet`, `parseError`, `totalKeys` |
| `Error while saving value to storage. Key: <KEY>`                                                          | Encoding or writing an atom value fails                                               | `errorTag`                                         |
| `MMKV encryption key was missing; unreadable encrypted storage was reset because no session secret exists` | Ciphertext without a key was discarded on a launch with no stored session secret      | none                                               |

Keys that were never written are expected. They appear in `valueNotSet` when a
summary is already being sent, but they do not trigger the summary by
themselves.

### Info level

`MMKV storage migrated from plaintext to encrypted` is sent once per install
after the plaintext store was imported, with `migratedPlaintextKeyCount` and
`encryptionKeySource`.

## Reading the signals

### Total loss

The total-loss error means the AsyncStorage sentinel says MMKV was previously
populated, but MMKV now has zero keys and its own sentinel is missing. The atom
summary may show many `valueNotSet` keys and should not show per-key parse
errors, because there are no values to parse.

A total-loss report on the same launch as the warning
`MMKV encryption key was missing; unreadable encrypted storage was reset because no session secret exists`
is the backup-restore case described in `mmkv_encryption.md`: the ciphertext
was discarded on purpose because its key did not survive, so this is not a
silent wipe.

The file fields are observations made after the native store has opened. A
missing or empty data file supports deletion or truncation. A present file does
not prove that all original entries survived, because native recovery may have
rewritten it before JavaScript gathered the metadata.

### Partial native recovery

The partial-loss error lists critical keys that were recorded previously but
are absent now. This is the expected signal when greedy recovery preserves only
an earlier valid prefix, although an interrupted write or another selective
loss can produce the same observation. Use `disappearedKeys` to determine the
affected domain. In particular, loss of one of the three key-holder maps can
break club or notification decryption even when contacts or offers remain.

The presence record is updated after a successful detection run, so the same
disappearance is normally reported once. If reporting throws, it is left
unstamped and retried next launch.

### Schema or JSON failure

A per-key parse report means the key still exists but cannot be decoded:

- `ParseError` with `rawValueIsValidJson: true` indicates valid JSON that does
  not match the current Effect Schema.
- `JsonParseError` with `rawValueIsValidJson: false` indicates malformed JSON,
  such as a partial or corrupted value.
- `ReadingFromStoreError` means MMKV threw while reading the key.

The atom uses its default after an initial parse failure. For collection atoms,
one invalid member can cause the whole stored collection to fail validation.

### No diagnostic event

Check the app build first. The AsyncStorage sentinel and critical-key presence
record need one successful run to establish a baseline. A first run after these
diagnostics ship cannot detect older loss that happened before the baseline was
written.

## Intentional logout or reset

`clearMmkvStorageAndEmptyAtoms` performs an intentional clear as one protected
lifetime:

1. Mounted atoms are reset to their defaults.
2. Pending atom writes are invalidated.
3. MMKV is cleared immediately, before any asynchronous cleanup.
4. The populated sentinel and critical-key presence record are removed from
   AsyncStorage on a best-effort basis.
5. MMKV is cleared again and writes queued during the clear are invalidated
   before normal persistence resumes.

The immediate clear is the security boundary. If AsyncStorage diagnostic
cleanup rejects, the clear still resolves and logout or reset is not blocked;
sensitive MMKV data remains cleared. An MMKV `clearAll()` failure is different
and still rejects because the sensitive store may not have been cleared.

Failed diagnostic cleanup can leave stale key-name metadata. On the next
launch, this can cause one false total-loss report if the populated sentinel
remained, or one false partial-loss report if only the critical-key record
remained. A successful detection run rewrites the sentinels and presence record
to the current empty state, so the signal normally self-heals. It never restores
the cleared MMKV values.

## Decision tree

```text
User reports missing MMKV-backed data
|
+- Total-loss error?
|  +- Yes: MMKV is empty; inspect file metadata and appState.
|  +- No: continue.
|
+- Partial-loss error?
|  +- Yes: inspect disappearedKeys for the affected domain.
|  +- No: continue.
|
+- Per-key parse error?
|  +- Yes: inspect errorTag and rawValueIsValidJson.
|  +- No: confirm the build and whether a baseline existed.
```

## Temporary diagnostics

The sentinel, critical-key presence record, startup summary, and related Sentry
reports are marked with TODOs for eventual removal. Keep these permanent safety
properties even after the investigation ends:

- v4 `recover-on-error` configuration;
- background-task final flushes and awaited iOS notification cleanup;
- write invalidation and immediate MMKV clearing during logout or reset.
