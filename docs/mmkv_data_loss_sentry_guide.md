# Diagnosing MMKV data loss from Sentry logs

This guide explains how to interpret the diagnostic Sentry reports added to
detect and distinguish two root causes of user data loss (offers, contacts,
clubs disappearing while the user remains logged in):

1. **Schema decode failures** — a breaking schema change (e.g. removing a
   `CurrencyCode` literal) causes stored data to fail validation. One bad
   record can cascade: e.g. one offer with a removed currency code fails the
   `OfferPublicPart` decode, which fails the entire `offers` array, resetting
   ALL offers to the empty default.
2. **Silent MMKV file-level wipe** — MMKV v3 defaults to `OnErrorDiscard`,
   which silently deletes all data on a CRC checksum mismatch. No Sentry trace
   is produced by MMKV itself because the wipe happens at the native layer
   before any JS code runs.

The diagnostics are **temporary** — all marked with TODO comments. Remove them
once the root cause is identified and fixed.

> **Privacy note:** None of these reports contain user data. Parse errors report
> only the error tag (e.g. `ParseError`), the MMKV key name, raw value length,
> and whether the raw value is valid JSON. The full `ParseError` object (which
> contains rejected values) is intentionally stripped.

---

## Code locations

| File | What it does |
| --- | --- |
| `apps/mobile/src/utils/mmkv/effectMmkv.ts` | Sentinel-based MMKV wipe detection (`detectMmkvDataLoss`) and MMKV file diagnostics (`getMmkvFilesDiagnostics`) |
| `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` | Per-key parse error reporting (`getInitialValue`) and startup summary (`scheduleStartupReport`) |
| `apps/mobile/src/utils/clearMmkvStorageAndEmptyAtoms.ts` | Clears the async sentinel on intentional logout/reset to prevent false positives |

---

## Message catalog

### ERROR level

| Message (verbatim) | Source | Emitted when | Extra fields |
| --- | --- | --- | --- |
| `MMKV data loss detected: data was previously stored but MMKV is now empty` | `effectMmkv.ts` → `detectMmkvDataLoss` | The MMKV sentinel key is missing but the AsyncStorage sentinel (written on a prior launch) is present — meaning MMKV was populated before but is now empty | `lastPopulatedAt`, `remainingKeyCount`, `appState`, `dataFileExists`, `dataFileSize`, `crcFileExists`, `crcFileSize` |

### WARN level

| Message (verbatim) | Source | Emitted when | Extra fields |
| --- | --- | --- | --- |
| `MMKV atom initialization summary` | `atomWithParsedMmkvStorage.ts` → `scheduleStartupReport` | 5 seconds after the first atom initializes, if any atom had a `valueNotSet` or `parseError` result | `loaded` (key list), `valueNotSet` (key list), `parseError` (key list), `totalKeys` |
| `Error while parsing stored value. Using provided default. Key: <KEY>` | `atomWithParsedMmkvStorage.ts` → `getInitialValue` | A specific MMKV key exists but fails schema validation at startup | `errorTag`, `rawValueLength`, `rawValueIsValidJson` |
| `Error while saving value to storage. Key: <KEY>` | `atomWithParsedMmkvStorage.ts` → `toShadowStorageAtom` | Writing a value back to MMKV fails (encode or write error) | `errorTag` |
| `Error while parsing stored mmkv value in onChange function. Key: '<KEY>'` | `atomWithParsedMmkvStorage.ts` → `onMount` listener | An MMKV value changed (by another atom or external write) and the new value fails schema validation | `errorTag` |

---

## How to read the signals

### Scenario A: Silent MMKV wipe (file-level corruption) 🔴

**Signature:**
- `MMKV data loss detected: data was previously stored but MMKV is now empty`
  (ERROR) fires.
- `MMKV atom initialization summary` shows most/all keys as `valueNotSet` —
  the data is simply gone, not malformed.
- Per-key `Error while parsing stored value` messages are **absent** (there is
  nothing to parse — the keys don't exist).

**Extra fields to check:**
- `remainingKeyCount: 0` confirms a full wipe.
- `dataFileExists: false` or `dataFileSize: 0` means the MMKV data file was
  deleted or truncated — points to OS-level cleanup or MMKV's `OnErrorDiscard`.
- `dataFileExists: true` with a non-zero `dataFileSize` but
  `crcFileExists: false` or size mismatch points to a CRC corruption that
  triggered `OnErrorDiscard`.
- `appState` tells you whether this happened during a foreground launch
  (`active`) or a background wake (`background`) — background wakes are more
  susceptible to resource pressure.

**What this means:**
MMKV's native layer wiped all data before JS had a chance to read it. This
explains contact loss (no Sentry decode errors for `storedContacts`) and
simultaneous loss of offers, clubs, and settings. The user's session survives
because it is stored in AsyncStorage + SecureStore, not MMKV.

### Scenario B: Schema decode failure (breaking schema change) ⚠️

**Signature:**
- `MMKV data loss detected` does **NOT** fire (MMKV is intact).
- `Error while parsing stored value. Using provided default. Key: <KEY>` fires
  for specific keys (e.g. `offers`, `offersFilter`, `brcPrice`).
- `MMKV atom initialization summary` shows those keys in the `parseError` list
  and other keys in `loaded`.

**Extra fields to check:**
- `errorTag: ParseError` means the JSON is valid but doesn't match the Effect
  Schema. This is the schema-mismatch case (e.g. a stored offer contains a
  `CurrencyCode` literal that was removed from the schema).
- `errorTag: JsonParseError` means the raw MMKV string isn't valid JSON at all —
  points to data corruption rather than a schema change.
- `rawValueIsValidJson: true` + `errorTag: ParseError` confirms a schema
  mismatch.
- `rawValueIsValidJson: false` means the stored bytes are not JSON — possible
  partial write or binary corruption.
- `rawValueLength: 0` means the key exists but is empty — unusual, may indicate
  a write was interrupted.

**Key-specific interpretation:**
- `offers` in `parseError` → likely a `CurrencyCode` or other enum literal was
  removed. One invalid offer causes the entire array to fail, losing ALL offers.
- `storedContacts` in `parseError` → the contact schema changed incompatibly
  (less likely — the schema has been backward-compatible).
- `offersFilter` / `brcPrice` / `chatClosedFeedbacksAtom` in `parseError` →
  smaller-impact settings atoms; still indicates a schema break but doesn't
  explain contact/club loss.

### Scenario C: Mixed — partial MMKV data present

**Signature:**
- `MMKV data loss detected` does **NOT** fire (the MMKV sentinel survived).
- `MMKV atom initialization summary` shows a mix: some keys `loaded`, some
  `valueNotSet`, some `parseError`.

**What this means:**
Some keys were lost or corrupted but not all. Possible causes:
- A partial MMKV write failure (app killed mid-write).
- Selective key corruption (less common with MMKV's append-only log).
- A combination of schema failures (for `parseError` keys) and missing data
  (for `valueNotSet` keys that should have been populated).

Cross-reference the `totalKeys` field in the summary with what's expected to
gauge the extent of loss.

### Scenario D: No diagnostic events at all

**What this means:**
If a user reports data loss but there are no MMKV diagnostic events in Sentry:
- The build may predate these diagnostics — check the `dist` / build number.
- The sentinel detection only works from the **second launch** after the
  diagnostic code ships (the first launch writes the initial sentinel).
- If the user logged out and back in, the intentional clear
  (`clearMmkvStorageAndEmptyAtoms`) removes the AsyncStorage sentinel, so the
  next launch won't fire a false positive — but it also won't detect a
  subsequent real wipe until after one more successful launch writes the
  sentinel again.

---

## `errorTag` reference

These are the `_tag` values from the Effect error types returned by the MMKV
storage layer:

| Tag | Meaning |
| --- | --- |
| `ParseError` | JSON was valid but failed Effect Schema validation (schema mismatch) |
| `JsonParseError` | Raw string is not valid JSON |
| `ReadingFromStoreError` | MMKV `.getString()` threw an exception |
| `WritingToStoreError` | MMKV `.set()` threw an exception |
| `ValueNotSet` | Key does not exist in MMKV (only in onChange listener — at startup this is tracked via the summary, not per-key errors) |

---

## Decision tree

```text
User reports data loss (offers/contacts/clubs gone, still logged in)
│
├─ "MMKV data loss detected" ERROR in Sentry?
│  ├─ YES → Scenario A: silent MMKV wipe
│  │  ├─ dataFileExists: false → OS or MMKV deleted the file
│  │  ├─ dataFileExists: true, crcFile missing/wrong → CRC mismatch → OnErrorDiscard
│  │  └─ Check appState: "background" → resource pressure / OS kill during write
│  │
│  └─ NO → Check "MMKV atom initialization summary"
│     ├─ parseError keys present, loaded keys present → Scenario B: schema failure
│     │  └─ Check which keys: offers? contacts? Look at errorTag for cause
│     ├─ Most keys valueNotSet, no parseError → Data is gone but sentinel survived
│     │  └─ Partial wipe or sentinel was written after the wipe (Scenario C)
│     ├─ All keys loaded → Data is present — user's report may be about stale data,
│     │  not missing data
│     └─ No summary event at all → Scenario D: diagnostics not yet active
```

---

## Temporary code — what to remove

All diagnostic code is marked with TODO comments. When the root cause is found
and fixed, remove:

1. `effectMmkv.ts`: `MMKV_SENTINEL_KEY`, `ASYNC_SENTINEL_KEY` (export),
   `getMmkvFilesDiagnostics`, `detectMmkvDataLoss`, and the call to it.
2. `atomWithParsedMmkvStorage.ts`: `InitResult` type, `atomInitResults` map,
   `startupReportScheduled` flag, `scheduleStartupReport` function, and the
   `atomInitResults.set(...)` / `scheduleStartupReport()` calls inside
   `getInitialValue`. The per-key `reportError` in `getInitialValue` may be
   worth keeping permanently (without the `rawValueLength` / `rawValueIsValidJson`
   extras) as a general parse-error monitor.
3. `clearMmkvStorageAndEmptyAtoms.ts`: the `ASYNC_SENTINEL_KEY` import and the
   `AsyncStorage.removeItem(ASYNC_SENTINEL_KEY)` call.
