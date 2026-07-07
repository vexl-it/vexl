# Smoke test results — 2026-07-07 (pre-release, branch `smoke-test`)

Smoke test of the app ahead of the next release. Baseline: last release `1.43.6_800` (tagged on a
one-commit release branch off `0f43a4b11`, so the tag itself is not in this history); this branch
is ~129 commits ahead of that release's branch point.
Setup: local backend (`pnpm dev:backend`, all services ready), Metro via `pnpm dev:mobile -p android`,
Android emulator "VexlPerf API 36" (2 GB RAM) with a previously installed dev-client build
(`it.vexl.nextstaging`, ENV_PRESET=local, seeded perf account with 400 offers).

## What was tested and works

| Flow | Result |
| --- | --- |
| App startup → marketplace (seeded account, 400 offers) | ✅ works (but see issue 2 — very slow, ANR dialogs) |
| Offer detail (seed offer) | ✅ renders correctly, all fields present |
| Send request / first chat message | ✅ sent; chat-service returned 200s (`REQUEST_SENT` metric logged); "Waiting for response" state shown; offer card switches to "Go to chat" |
| Marketplace pull-to-refresh (removed-offers reconciliation) | ✅ no errors, offer list intact |
| New offer flow — listing type (Bitcoin/Products/Services), buy/sell, amount + live BTC rate, location (In person/Online), network step, description, language, friend degree (reach 200/300) | ✅ whole wizard works; BTC rate loaded from local btc-exchange-rate-service |
| Offer publish (encrypt for 300 people → POST /api/v2/offers) | ✅ server-side created (200) — but the app **crashed natively** right after, see issue 1 |
| My offers | ✅ 101 offers listed, the smoke-test offer persisted at the top despite the crash |
| Chats tab | ✅ sent request shows "Your request was sent"; seeded conversations listed |
| Chat detail (seeded conversation) | ✅ message history renders, input works |
| Trade checklist | ✅ opens; networks step shows new copy "The person receiving bitcoin will set the BTC network" (BTC address removal, #2484) |
| Suggest amount screen | ✅ has the new **Save** button (#2485); live market price loads |
| Community → Discover (clubs) | ✅ renders "Join a club" section |
| Community → Board (new feature #2259) | ✅ onboarding modal + empty board render — but dismissing the onboarding sheet **crashed the app with the same worklets abort as issue 1** |
| Backend services logs (all 10 services) | ✅ clean except content-service 500s (issue 4) |

Not covered: profile edit (optional photo, #2489), donations flow (#2557), club join flow, board
note creation (blocked by the second crash). Recommend covering these after the worklets fix,
ideally on a faster device/emulator.

## Issues found

### 1. 🔴 Native crash (SIGABRT) in `libworklets.so` after publishing an offer

- **When:** reproduced **twice** in one session — (a) ~13 s after `POST /api/v2/offers` succeeded,
  while the "Encrypting your offer …" progress modal / done-state (`hideDeffered`, 3 s delay) was
  wrapping up; (b) when dismissing the Community-Board onboarding sheet (animated Dialog whose hide
  path calls `scheduleOnRN`, `packages/ui/src/components/Dialog.tsx:127-129`). Both times the app
  hard-crashed to the home screen. This fires on ordinary UI interactions — release blocker.
- **Crash:** `jsi.h:2014: Object facebook::jsi::Value::getObject(IRuntime &) &&: assertion "isObject()" failed`
  on thread `mqt_v_js`, frames in `libworklets.so` →
  `facebook::react::CallInvoker::invokeAsync` lambda.
- **Root cause:** `react-native-worklets@0.10.0`
  `SerializableRemoteFunction::RNOrigin::resolveOrRejectPromise` looks the callback up in the JS-side
  `__remoteFunctionRegistry` by id and calls `.getObject()` on the result. If the RN-side remote
  function was already unregistered/GC'd (progress modal unmounted after publish), `registry.get(id)`
  returns `undefined` → assertion abort. Debug builds abort; the registry mechanism is unsound in
  0.10.0 regardless.
- **Fix:** upgrade `react-native-worklets` 0.10.0 → **0.10.2** — verified by diffing the packages:
  0.10.2 removed the whole `__remoteFunctionRegistry` / `RNOriginProxy` design and replaced it with
  direct function references guarded by runtime-lifetime tracking (also "removed erroring when can't
  createSerializable").

### 2. 🟠 Startup is extremely slow on a low-memory device → ANR dialogs + process kill loop

- First cold start took **~2 minutes** from bundle load to interactive marketplace
  (bundle done 14:59:25 → `Libsodium.install` 15:00:18 → in-app loading tasks completed 15:02:14).
  The app's own splash watchdog fired and reported `Error: App is taking too long to load`
  (`AnimatedSplashScreen.tsx:190`).
- System ANR: `Input dispatching timed out … MainActivity` — user-visible "Vexl (local) isn't
  responding" dialogs on every launch attempt.
- After the crash in issue 1, WorkManager (`androidx.work…SystemJobService`, used by
  `expo-background-task` / `newOffersNotificationBackgroundTask`, 15-min interval) kept restarting
  the app process **headlessly in the background**; each restart boots the full RN app, took >20 s at
  ~200 % CPU and was repeatedly killed with `bg anr: Process failed to complete startup`, in a loop.
  On a 2 GB emulator this thrashes the whole device into swap.
- **Caveat:** dev build (Metro bundle over the wire, no Hermes bytecode precompile) on a 2 GB
  emulator is the worst case; release builds are much faster. But the pattern "background task boots
  the entire app every 15 min" is also true in production and deserves a look (battery, low-end
  Android ANRs are Play-Store-visible).
- **Suggested follow-ups:** measure release-build cold start of the headless background task on a
  low-end device; consider gating the background task's work (it already early-returns when app is
  `active`, but the JS app still fully boots first).
- **Implemented (this branch):** raised the background task `minimumInterval` from 15 min to
  **1 hour** (`apps/mobile/src/utils/backgroundTask/index.ts`) — a 4× cut in headless full-app
  boots (max 24/day vs 96/day). Initially raised to 4 hours, then revisited during review (see
  tradeoff below). Because `registerTaskAsync` is a no-op for an already-registered task,
  `setupBackgroundTask` now reads the persisted options via `TaskManager.getTaskOptionsAsync` and
  unregisters + re-registers when the interval differs, so existing installs migrate off 15 min.
  Deliberately **not** done: registering only when the `newOfferInMarketplace` preference is on —
  the task also delivers the background chat-message sweep (with local chat notifications), which
  must keep running regardless of that preference; and lazy-loading the headless boot itself
  (index.js import graph split) — too invasive pre-release.
- **Product tradeoff (release note):** every run of this task also performs the fallback
  chat-inbox sweep (`processBackgroundTask.ts` → `fetchMessagesForAllInboxesAtom`), which is the
  **only** way a chat message surfaces as a notification while the app is backgrounded for users
  whose push doesn't work — notably de-googled Android without Play Services/FCM, a real segment
  of Vexl's privacy-focused user base. The sweep runs unconditionally (there is no "push is
  broken" signal); for push-working users it's a redundant no-op. Worst-case backgrounded chat
  notification latency for push-broken users therefore moves from ~15 min to **~1 h nominal**
  (longer under Doze/app-standby — the OS treats the interval as an inexact minimum). 1 h was
  chosen over 4 h because the marginal perf win shrank (15 min→1 h removes 72 boots/day; 1 h→4 h
  only 18 more) while chat latency would quadruple — bad for time-sensitive trade chats, and the
  ANR kill loop above was primarily the worklets crash (fixed) being restarted by WorkManager,
  not the interval itself. Opening the app still fetches messages immediately (resume sweep)
  regardless of this interval.

### 3. 🟡 Session read race at startup: "Using dummy session" warning while logged in

- Twice during startup (13:02:06): `👀 User is not logged in. Using dummy session. But user should
  be logged out.` from `apps/mobile/src/api/index.ts:116` (`sessionCredentialsAtom`) — fired while
  the session was still `loading`, for a logged-in user. Some consumer built an API client before
  session load finished. If a request fires in that window it goes out with dummy credentials
  (401 / garbage auth against backend).
- Investigation: the security headers were actually snapshotted **once at API construction**
  (`makeCommonAndSecurityHeaders` called at construction in the user/contact/offer/chat services),
  and the two warnings came from `apiAtom` being built at splash time (mounted by
  `useSetupVersionServiceState` at state `initial`, recomputed at `loading`) — the only request on
  the wire in that window (`getVersionServiceInfo`) is public, so no dummy auth headers were sent.
- **Fixed:** security headers are now built lazily per request in the four authenticated services,
  and the mobile credentials getter (`apps/mobile/src/api/index.ts`) fails fast with a typed
  `SessionNotReadyError` while the session is `initial`/`loading` (it always settles, see
  `loadSession`), keeping the dummy-credentials + warning behavior only for the genuine
  `loggedOut` case (onboarding/public flows unchanged).

### 4. 🟡 Community events/blogs fail against local backend (config, not code)

- Opening Community fires `GET /content/events` and `/content/blogs` → content-service returns
  **500** ("Unexpected server error", upstream Webflow API responded 404) and the app reports
  `Error: Failed to load events` via reportError. Cause: the local dev config ships empty
  `WEBFLOW_TOKEN` / collection IDs (`tooling/dev/services.ts:264-277`), so the Webflow request 404s.
- Not a release blocker (prod has real tokens). Options: document putting a real token in
  `.env.local`, or make content-service degrade gracefully (empty list + warn) when the CMS is not
  configured, so local devs don't hit red error reporting.

### 5. 🟡 Minor warnings (low priority)

- `InteractionManager has been deprecated and will be removed in a future release` (RN 0.86
  deprecation) — `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` uses
  `InteractionManager.runAfterInteractions` for the coalesced MMKV flush (recent perf work).
- `Sentry disbaled` typo in a startup debug log.
- `statusBarTranslucent and navigationBarTranslucent values are ignored when using
  react-native-edge-to-edge` — RN `Modal`s still pass `statusBarTranslucent`
  (`packages/ui/src/components/Dialog.tsx:173`,
  `apps/mobile/src/components/ChatDetailScreen/components/TextMessageActionMenu.tsx:266`).
- Expo CLI: `Could not find a shared URI scheme for the dev client between the local /ios and
  /android directories` on `expo start` (dev-tooling only).
- `npx expo install --check`: expo 57.0.2 → ~57.0.4 and 3 other packages may need updating.

## Fixes applied (same day, committed on this branch)

1. **Issue 1 (worklets crash):** bumped `react-native-worklets` 0.10.0 → 0.10.2 in
   `apps/mobile/package.json`, `packages/ui/package.json`, `apps/ui-book/package.json`
   (+ lockfile; pnpm auto-added a `minimumReleaseAgeExclude` entry for exactly
   `react-native-worklets@0.10.2` to `pnpm-workspace.yaml` because the release is <1 day old —
   review/keep that entry consciously). reanimated 4.5.0's peer range `0.10.x` allows it;
   `manypkg check` passes. ⚠️ **Requires a native rebuild of the dev client / release binaries**
   (worklets is a native module) — a JS-only OTA will version-mismatch.
2. **Issue 5 cleanups:** removed ignored `statusBarTranslucent` from the RN Modals in
   `packages/ui/src/components/Dialog.tsx` and
   `apps/mobile/src/components/ChatDetailScreen/components/TextMessageActionMenu.tsx`; fixed the
   "Sentry disbaled" log typo in `apps/mobile/src/utils/setupSentry.ts`.
3. **Verification:** `pnpm turbo:typecheck`, `pnpm turbo:format`, `pnpm turbo:lint` all pass
   (29/29 tasks each, 0 errors).

## Still to do before release

1. Rebuild the dev client (`pnpm dev:mobile -p android --build`) — **done**. Re-verify on device:
   publish an offer end-to-end (no crash after the "done" modal), dismiss the Board onboarding sheet
   (no crash) — handed over for on-device verification, **not yet confirmed**.
2. Cover the untested flows: profile edit (optional photo), donations, club join, board note posting.
3. Issue 3 (dummy-session race) is fixed (per-request security headers + fail-fast while the
   session loads, see above). Issue 2 (background-task cold-boot cost) is not a regression and
   remains tracked above.
