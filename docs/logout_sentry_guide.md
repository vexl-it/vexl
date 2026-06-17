# Verifying the "users logged out on startup" fix in Sentry

This guide explains how to tell — from Sentry alone — whether the fix for the
startup logout bug ([#2481](https://github.com/vexl-it/vexl/issues/2481), PR
[#2514](https://github.com/vexl-it/vexl/pull/2514)) is working in production.

**The fix ships in build `800`.** Always scope your Sentry queries to that build
and newer (see [Filtering](#filtering-in-sentry)). Older builds (750/751/770/780)
will keep producing the _old_ error signatures — that is expected and not a
regression.

> **Read this first — the most important mindset shift.** Before the fix, a
> failed secure-storage read at startup _silently logged the user out_ and was
> reported once per failure as a single error. After the fix we **never log the
> user out** on these failures. Instead we retry, and if that fails we show a
> blocking "Session Recovery" screen. So the goal of monitoring is **no longer**
> "did the error stop happening" — the underlying iOS Keychain hiccup may still
> occur. The goal is: **when it happens, did the user recover (keep their
> account) instead of being logged out?**

---

## TL;DR checklist

On build `800+`, in order of importance:

1. ✅ **`‼️ Error while reading or parsing user data from secure storage.`** must
   be **gone** (0 events). This is the old logout signature; the code no longer
   emits it.
2. ✅ **`Session login attempt succeeded`** and **`Blocking session recovery
reload succeeded`** (INFO) should appear and ideally outnumber the blocking
   errors — these mean users hit the problem and **recovered**.
3. ⚠️ **`Session load requires blocking recovery. tag: ...`** (ERROR) is the
   "user is currently stuck on the recovery screen" signal. Some volume is
   expected during migration; **a high or non-decaying volume means the
   underlying problem persists** (users are blocked, though not logged out).
4. 🔴 **`Session load requires blocking recovery. tag: V2SecretReadFailedAfterBeingWritten`**
   at any meaningful volume means the core keychain fix itself is **not working**
   — escalate.
5. 🆕 A **spike** of `Unexpected error while loading session. tag: ParseError` /
   `tag: CryptoError` / `tag: SessionSanityCheckFailed` would indicate a
   **new/regression** problem we introduced — investigate.

---

## What the code reports now (message catalog)

All of these come from `apps/mobile/src/state/session/loadSession.ts` and
`apps/mobile/src/AnimatedSplashScreen.tsx` (plus the notification/background
callers). **None of these messages contain user data** — only an error _tag_, so
they are safe to read and share.

### ERROR level

| Message (verbatim)                                    | Emitted when                                                                                                               | Meaning                                                                                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Session load requires blocking recovery. tag: <TAG>` | After the 2s auto-retry **still** fails, or each time a "Try Again" tap on the recovery screen fails                       | The user is **blocked on the recovery screen** (NOT logged out). `<TAG>` says why — see [tag table](#blocking-recovery-tags).                                                                             |
| `Unexpected error while loading session. tag: <TAG>`  | A failure **after** the session was successfully read (auth upgrade, write, or sanity check). Fires once per load attempt. | Post-read failure. After this fix it also routes to the recovery screen instead of stranding the user. `<TAG>` ∈ `UpgradeSessionError`, `SessionPersistenceError`, `SessionSanityCheckFailed`, `unknown`. |

### WARN level

| Message (verbatim)                                                      | Emitted when                                         | Meaning                                                                                                                                               |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Waiting for sessionfinished timeout`                                   | A concurrent caller waited >5s for an in-flight load | Downstream symptom. **Downgraded from ERROR → WARN** in this fix; should _decline_ on 800+. (Was Sentry issue `VEXL-APP-16H`.)                        |
| `Got notification but no session in storage. Skipping refreshing inbox` | A chat push arrived while no session was loaded      | Downstream symptom (`VEXL-APP-16S` / `VEXL-APP-XG`). Should _decline_ on 800+.                                                                        |
| `App is taking too long to load`                                        | Splash still not ready after 5s                      | Pre-existing splash watchdog. A **spike** on 800+ could mean the new gating logic is stuck — see [regressions](#3-signals-we-introduced-a-new-error). |
| `Splash screen animation did not complete even after 5s. ...`           | Splash animation watchdog                            | Pre-existing; not session-related.                                                                                                                    |

### INFO level — these are the **recovery / success funnel**

| Message (verbatim)                                                                                    | Emitted when                                                             | Meaning                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `Session not loaded on first attempt. Retrying after delay. This is a fallback and should not happen` | First splash load failed with a blocking error; a 2s retry was scheduled | **The problem occurred.** Count of this ≈ how often the startup failure is still happening at all.             |
| `Session login attempt succeeded`                                                                     | The 2s auto-retry succeeded                                              | ✅ **Best outcome** — transient failure, user kept their session automatically, never saw the recovery screen. |
| `Blocking session recovery reload succeeded`                                                          | User tapped "Try Again" on the recovery screen and it worked             | ✅ Good outcome — user recovered manually instead of being logged out.                                         |

> INFO events are captured as standalone Sentry issues (via `captureException`),
> so you can chart their counts just like errors.

### Gone on 800+ (must NOT appear)

| Message (verbatim)                                                 | Status                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `‼️ Error while reading or parsing user data from secure storage.` | **Removed.** This was the original logout signature (`VEXL-APP-167`). The code path that emitted it no longer exists. Any occurrence on `dist:800+` means the build doesn't actually contain the fix (or release/dist tagging is wrong). |

### <a name="blocking-recovery-tags"></a>`tag:` values for "Session load requires blocking recovery"

`<TAG>` = the storage error tag, or `SessionLoadFailed` as a fallback:

| Tag                                   | What it means                                                                                       | Severity for monitoring                                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ErrorReadingFromSecureStorage`       | iOS Keychain read failed ("User interaction is not allowed") — **the original root cause of #2481** | The headline number to watch. Expected to **decay** as users migrate; should be increasingly rare.                   |
| `V2SecretReadFailedAfterBeingWritten` | We wrote the key with the new `AFTER_FIRST_UNLOCK` flag **and still couldn't read it back**         | 🔴 **Most serious.** Means the core fix is ineffective. Escalate if non-trivial.                                     |
| `StoredSessionSecretUnavailable`      | Encrypted session exists but the secret token is missing                                            | Investigate; should be rare.                                                                                         |
| `ErrorReadingFromAsyncStorage`        | The encrypted session blob couldn't be read                                                         | Rare; storage-layer issue.                                                                                           |
| `ParseError` / `CryptoError`          | Session decrypted/parsed but didn't match the schema                                                | Deliberately blocking (we never auto-logout on possible corruption). A **spike is a regression signal** — see below. |
| `SessionLoadFailed`                   | Fallback — comes from the post-read "unexpected error" path                                         | Cross-reference the paired `Unexpected error while loading session. tag: ...` for the real cause.                    |

---

## How to read the signals

### 1. Signals the fix is WORKING ✅

- `‼️ Error while reading or parsing user data from secure storage.` is **0** on
  `dist:800+`.
- You see `Session not loaded on first attempt. Retrying after delay...`
  (the problem still occurs sometimes) **followed by** `Session login attempt
succeeded` — i.e. the auto-retry is catching it. A healthy ratio is
  _most_ "retrying" events being followed by a "succeeded".
- `Blocking session recovery reload succeeded` events exist — users who weren't
  auto-recovered are recovering via the button.
- `Waiting for sessionfinished timeout` and `Got notification but no session in
storage...` **decline** vs builds 750–780.
- The blocking-recovery ERROR volume **decays over the days/weeks after release**
  (as installed users migrate to the new `AFTER_FIRST_UNLOCK` key on their first
  successful foreground launch).

> The single best "it's fixed" proxy: **(retry + reload successes) ≫ (blocking
> recovery errors)**, and the old `VEXL-APP-167` signature at zero.

### 2. Signals the bug is STILL there ⚠️

- `Session load requires blocking recovery. tag: ErrorReadingFromSecureStorage`
  stays **high and does not decay** on 800+ → the Keychain read keeps failing and
  the 2s retry isn't enough; users are sitting on the recovery screen. They are
  **not logged out** (the destructive bug is fixed) but they're **blocked**, which
  is still bad.
- `tag: V2SecretReadFailedAfterBeingWritten` at meaningful volume → the
  `AFTER_FIRST_UNLOCK` change isn't actually making the key readable. 🔴 Escalate.
- Few or no `Session login attempt succeeded` / `Blocking session recovery reload
succeeded` relative to the "retrying" / blocking-error counts → users hit the
  problem and **cannot** recover.

> **Important blind spot:** if a user is _still being logged out_ on 800+ (e.g.
> some path we missed), it will **not** produce any of the messages above —
> it would be _silent_ on the session side. To catch that, also watch for an
> **unexpected rise in fresh onboarding / login-flow events on `dist:800+`**, and
> keep an eye on support reports of lost accounts. Absence of session errors is
> necessary but not sufficient proof; corroborate with onboarding volume.

### 3. Signals we introduced a NEW error 🆕

- A **spike** (vs older builds) of `Session load requires blocking recovery. tag:
ParseError` or `tag: CryptoError` → we may now be **blocking valid sessions**
  we previously let through. Because we deliberately treat these as blocking, a
  real-session false-positive now traps the user on the recovery screen.
  Investigate whether a recent session-schema or crypto change is misclassifying
  good data.
- A spike of `Unexpected error while loading session. tag: SessionSanityCheckFailed`
  → the post-read sanity check is failing for real users (newly made
  user-visible/blocking by this fix). Investigate session construction.
- A spike of `Unexpected error while loading session. tag: UpgradeSessionError`
  → the V1→V2 auth-upgrade endpoint is failing (this is the old `VEXL-APP-1AA`
  path; it now blocks-and-retries instead of stranding). Check the
  `upgrade-auth/init` endpoint health — likely a backend/network issue, not the
  client.
- A spike of `App is taking too long to load` on 800+, or reports of a **blank /
  white screen** at startup → the new splash gating
  (`blockingRecoveryRequired` / `isAppReady`) may be stuck. Treat as a
  client-side regression in `AnimatedSplashScreen.tsx`.
- The same `session_id` / user emitting many `Session load requires blocking
recovery` errors in quick succession → a user repeatedly tapping "Try Again"
  without success. Not a new error type, but a UX-stuck pattern worth surfacing.
- Any **new, previously-unseen** message correlated with `dist:800+` around
  splash/session startup.

---

## Mapping to the original Sentry issues

| Original issue                | Old message                                                             | What to expect on 800+                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VEXL-APP-167`                | `‼️ Error while reading or parsing user data from secure storage.`      | **Zero.** Replaced by the blocking-recovery / retry-success messages.                                                                             |
| `VEXL-APP-16S`, `VEXL-APP-XG` | `Got notification but no session in storage. Skipping refreshing inbox` | Should **decline**.                                                                                                                               |
| `VEXL-APP-16H`                | `Waiting for sessionfinished timeout`                                   | Should **decline**; also now WARN, not ERROR.                                                                                                     |
| `VEXL-APP-1AA`                | `Unexpected error while loading session`                                | Still possible, but now blocks-and-retries instead of stranding. Watch its `tag:` — `UpgradeSessionError` points at the backend upgrade endpoint. |

---

## <a name="filtering-in-sentry"></a>Filtering in Sentry

- **Scope to the fixed build:** filter by `dist:800` (the build number — the same
  "Build (dist)" dimension used in the original investigation). For the whole
  release cycle, include subsequent builds too (`dist:800`, `dist:801`, …).
- **Platform:** the root cause is iOS Keychain, so filter `os.name:iOS` when
  looking at `ErrorReadingFromSecureStorage` / `V2SecretReadFailedAfterBeingWritten`.
- **Release:** Sentry's `release` is set to the commit hash
  (`setupSentry.ts`), so you can also pin to the exact commit that built 800.
- **Find a message:** search the issue list by a verbatim substring, e.g.
  `Session load requires blocking recovery` or `Session login attempt succeeded`.
  The varying `tag: ...` suffix means each tag may appear as its own issue —
  search the stable prefix to see them together.
- **Compare against the baseline:** put `dist:800+` next to `dist:[750,751,770,780]`
  for the same messages to see the trend rather than absolute counts.

---

## One-line summary

> On build 800, **the old logout signature should be gone**, the **retry/recovery
> success INFO events should dominate**, and the **blocking-recovery errors should
> be low and decaying**. Persisting high blocking-recovery volume means users are
> _stuck but safe_; a spike in `ParseError`/`CryptoError`/`SessionSanityCheckFailed`
> means _we broke something new_; and remember a _silent_ logout would show up as
> rising onboarding volume, not as a session error.
