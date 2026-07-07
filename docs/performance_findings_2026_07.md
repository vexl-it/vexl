# Android Performance Investigation (July 2026)

> How this report was produced: the app (staging dev build) was profiled on an Android
> emulator against a locally running backend, first with an empty account, then with a
> seeded realistic account (200 imported contacts, 700 offers — 600 incoming from 300
> registered fake users + 100 own — and 30 chats × 40 messages). Measurements came from
> `adb dumpsys gfxinfo`, `am start -W`, React DevTools render profiles, and the app's own
> task-timing logs. Every measured regression was traced to code before being reported.
> Data seeding is reproducible with `tooling/dev/seed-perf-data.ts` (see script header).

# Vexl Android Performance Investigation — Synthesis Report

## Methodology

- **Device/build:** Android emulator (emulator-5554), staging dev build (`it.vexl.nextstaging`, Metro on :8081, Hermes, `dev=true`). Absolute numbers are inflated by dev overhead; **only baseline-vs-loaded deltas and component-level evidence are meaningful**.
- **Baseline:** near-empty account (0 contacts, 0 offers, 0 chats).
- **Loaded:** seeded realistic account — 200 imported contacts, 600 incoming offers (400 visible), 100 own offers, 30 chats × 40 messages (backed by 300 registered fake users).
- **Mirrored scenarios:** 3× cold start (`am start -W` + JS InAppLoadingTask log timings), 60s foregrounded idle (gfxinfo + JS logs), tab navigation (react-devtools profile, identical tap coordinates, screenshot-verified), marketplace scroll (gfxinfo, identical swipe script). Loaded run added: offer-refresh cost sampling, marketplace-scroll render profile, chat-open profile.
- **Cross-referencing:** every measured regression was traced to code (file:line); static findings without measurement corroboration are marked _plausible_.
- Profile exports and raw logs: `<local artifacts dir>/` (`baseline-tabs.json`, `loaded-tabs.json`, `loaded-chatopen.json`, `loaded-coldstart-run{1,2,3}-logs.txt`, gfxinfo dumps, screenshots).

## Baseline vs Loaded

| Metric                                          | Baseline (empty)     | Loaded (200 contacts / 700 offers / 30 chats)                 | Delta                                                                                  |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Native cold-start TTI (median)                  | 1618 ms              | 1537 ms                                                       | **unchanged** — launch itself is not data-driven                                       |
| JS task: syncConnections                        | 43.4 s               | 60.4 s (all 3 runs ±0.1s)                                     | **+17 s**, of which ~15 s is a silent stall after the 100 per-offer connection updates |
| JS task: fetchMessagesForAllInboxes             | 79 ms                | 5.4 s steady (19.4 s first run)                               | **~68×**                                                                               |
| JS task: refreshOffersAndEnsureInboxes          | 36 ms                | 4.3 s                                                         | **~120×**                                                                              |
| JS task: loadContactsFromDevice                 | 2.8 s                | 5.0 s                                                         | +2.2 s                                                                                 |
| JS tasks: loadNews / refreshNotes / refreshUser | ~250 ms              | ~4.3 s each                                                   | pure JS-thread queueing behind the offer refresh                                       |
| Startup first two offer refreshes               | 993 / 960 ms         | 4.3 / 2.3 s                                                   | ~4×                                                                                    |
| Offer refresh, steady state (no new offers)     | 40 ms                | 149–217 ms                                                    | ~5× (modest)                                                                           |
| Ingesting 700 offers (one refresh)              | —                    | 4.78 s                                                        | JS-thread block                                                                        |
| Idle 60 s: refresh firings                      | 12 (every 5 s)       | **0**                                                         | 5s poll is an **empty-marketplace artifact**                                           |
| Idle 30 s: native frames rendered               | 0                    | 0                                                             | idle is clean in both                                                                  |
| Tab switch (BaseNavigationContainer render)     | avg 196 / max 297 ms | avg 432 / max 1007 ms (Chats tab)                             | 2.2× avg / 3.4× max                                                                    |
| Tab-nav profile total commit time               | 1133 ms / 36 commits | 2163 ms / 24 commits                                          | +91%                                                                                   |
| Marketplace scroll janky frames                 | 5.26%, p99 81 ms     | 5.63%, p99 40 ms                                              | **unchanged** — scroll is healthy                                                      |
| Chat open → full history visible                | —                    | ~2–3.3 s (shell at 1.4 s, message area blank ≥0.3–1.5 s more) |                                                                                        |

**Headline:** native startup and list scrolling are fine. The slowness lives in (a) the post-launch/resume JS task batch — dominated by syncConnections, the offer refresh pipeline, and per-inbox message fetching — which saturates the JS thread for tens of seconds every time the app is foregrounded, and (b) navigation-time render cost on the Chats tab and chat-open, driven by identity-churning jotai selectors and FlashList prop instability.

---

## Ranked Findings

### 1. syncConnections runs on **every app foreground** and ends in an O(offers²) MMKV-rewrite stall (~15 s with 100 own offers) — CONFIRMED, high

**User impact:** for the first minute after opening the app, the JS thread is busy — taps feel laggy, other startup tasks queue behind it (measured: three trivial ~250 ms tasks inflate to ~4.3 s). This is the single biggest "the app is slow" contributor for users with own offers, and it repeats on every resume (`runOn: 'resume'`, `apps/mobile/src/state/connections/syncConnectionsInAppLoadingTask.ts:13`).

**Root cause (measured 60.3–60.5 s, stable across runs):**

- The final phase, `updateAndReencryptAllOffersConnectionsActionAtom` (`apps/mobile/src/state/connections/atom/offerToConnectionsAtom.ts:372`), logs 100 per-offer updates at 1–19 ms each, then goes silent ~15 s before task completion. Explanation found in code: each per-offer update calls `set(oneOfferConnectionsAtom, ...)` (`offerToConnectionsAtom.ts:345`) which writes through `createSingleOfferToConnectionsAtom` into the **whole** `offer-to-connections` persisted atom (`offerToConnectionsAtom.ts:38`). Each write queues an `InteractionManager.runAfterInteractions` full effect-Schema encode + `JSON.stringify` + MMKV write of **all** offers' connection lists (`atomWithParsedMmkvStorage.ts:88–104`), and each MMKV write fires the change listener which re-`JSON.parse`s the entire blob just to check authorship (`atomWithParsedMmkvStorage.ts:203–207`). With 100 offers × ~200 connections each, that's 100 × (full encode + full parse) of a multi-MB blob executed back-to-back after the loop — the ~15 s stall, reproduced on all 3 runs.
- Also: `deleteOrphanRecordsActionAtom` uses `adminIds.includes` inside a filter — O(offers²) (`offerToConnectionsAtom.ts:154–163`).
- The inner "Sync connections" step (45.7 s loaded, 43 s at baseline) blocks inline on `getNotificationTokenE()` with **no timeout** (`apps/mobile/src/state/connections/atom/connectionStateAtom.ts:80–83`); on this emulator the Expo token fetch hangs on DNS (test noise), but the same untimed network dependency will stall syncConnections on flaky mobile networks in production.

**Fix sketch:** accumulate connection updates in memory and write `offerToConnectionsAtom` **once** after the loop (or debounce/coalesce shadow-storage persists per key); replace `includes` with a `Set`; wrap `getNotificationTokenE()` in `Effect.timeout` (it only gates optional metrics reporting — fork it like the metrics call already is).
**Status (this PR):** the client-side fixes landed — batched connection write + `Set`-based orphan check, and a 3s `Effect.timeout` around `getNotificationTokenE()` in `apps/mobile/src/state/connections/atom/connectionStateAtom.ts:87` (the same guard was also added to the clubs token fetches, `refreshClubsActionAtom.ts:71` and `checkForClubsAdmissionActionAtom.ts:28`).
**Effort:** medium. **Risk:** the connection-update flow feeds private-part re-encryption — batching the _state write_ is safe, but do not change what gets encrypted/uploaded; verify offers still receive connection updates after backgrounding mid-run.

### 2. Systemic: monolithic MMKV persisted atoms — full-blob Schema encode on every write, full re-parse in the change listener, and double decode at startup — CONFIRMED, high

**User impact:** amplifies _every_ hot path: one chat message received, one offer flag toggled, one contact marked seen → re-encode + rewrite of the entire chats/offers/contacts blob, followed by a redundant full parse. Startup pays two full decodes per big blob. This is the shared mechanism behind findings 1, 3, 4, 7 and all four static analysis dimensions independently converged on it.

**Root cause:** `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` —

- write path (lines 88–104): full `Schema.encode` + `JSON.stringify` + synchronous MMKV set per write; `saveWithAuthorKey` also rebuilds the extended schema (`Schema.extend`) on every write (line 65);
- change listener (lines 203–214): `getVerified(key, AuthorKeySchema)` JSON.parses the whole blob just to read the author id; for foreign writes it then decodes **twice** (`getVerified(key, schema)` followed by redundant `Either.flatMap(decodeValue)` on the already-decoded value — also a latent correctness bug, since the second decode receives `Option` instances, not the encoded shape);
- startup (lines 175 + 190): `getInitialValue` runs a synchronous full JSON.parse + Schema decode at **module import time**, then `onMount` unconditionally repeats the identical decode.
- Affected single-key stores: `messagingState` (ALL chats+messages, `state/chat/atoms/messagingStateAtom.ts:7`), `offers` (`state/marketplace/atoms/offersState.ts:22`), `storedContacts` (`state/contacts/atom/contactsStore.ts:10`), `offer-to-connections`, `connectionsStateV2`, ~30 call sites total.

**Fix sketch:** (a) store the author id in a separate tiny MMKV key (or in-memory last-write flag) so the listener check is O(1); (b) delete the redundant `decodeValue` pass; (c) memoize the extended schema per key; (d) cache the initial decode and skip the onMount re-read unless the raw string changed; (e) longer term, shard hot collections (per-inbox/per-chat keys, offers pages) and debounce persists.
**Effort:** (a)–(d) small–medium and high-leverage; (e) large. **Risk:** persistence-format changes need a migration path; keep schema validation on read (data integrity matters in an E2E app). No crypto flows touched.

### 3. Offer refresh pipeline: O(N²) merge + O(offers × commonFriends × contacts) filtering + unconditional full-state writes → 4.3 s JS block on every app foreground — CONFIRMED, high

**User impact:** every foreground/marketplace visit blocks the JS thread for seconds (measured 36 ms → 4.3 s first refresh, ×2 per launch; 4.78 s when 700 offers actually arrive; three unrelated startup tasks measured queueing ~4 s behind it). Explains "app feels frozen right after opening".

**Root cause:**

- `mergeIncomingOffersToState` (`state/marketplace/atoms/refreshOffersActionAtom/utils/mergeIncomingOffersToState.ts:25–38`): `Array.union` (O(n²) `dedupeWith` with `Equal.equals`) plus two linear `findFirst` scans per id → quadratic over all stored+incoming offers, every refresh.
- `offersToSeeInMarketplaceAtom` (`state/marketplace/atoms/offersToSeeInMarketplace.ts:53–60`): per offer, `deriveVisibleCommonFriendsForOffer` does `Array.intersection(Array.union(commonFriends, verifiedCommonFriends), importedContactsHashes)` — effect's intersection is a nested linear scan with `Equal.equals` per pair → O(offers × friends × contacts). Recomputes on every offers/contacts change; also re-invoked in `sortOffers.ts:23`, `filterOffersByText.ts:46`, and per card in `useVisibleCommonFriendsForOffer`. It also runs a Sentry-reporting side effect + O(N) map inside the atom getter.
- The refresh always bumps `lastUpdatedAt2` and builds a fresh array (`refreshOffersActionAtom/index.ts:63–74`), so even a no-op refresh triggers the full-blob MMKV rewrite (finding 2) and invalidates the entire derived-atom chain. `getRemovedOffersIds.ts:58–93` additionally POSTs every stored offer id per refresh.

**Fix sketch:** Map/Set-based merge (O(N)); short-circuit and return the same array reference when nothing came in; derive `importedContactsHashesSet` once and use `set.has()` in common-friends derivation; move `lastUpdatedAt2` and the Sentry report out of the offers blob/getter; throttle the removed-offers reconciliation to app-foreground/N-minutes cadence.
**Effort:** medium. **Risk:** merge semantics for owned offers are intertwined with finding 9 — fix together; no crypto changes.

### 4. fetchMessagesForAllInboxes: one HTTP roundtrip per inbox, and every own offer owns an inbox → 100+ requests per resume (79 ms → 5.4 s) — CONFIRMED, high

**User impact:** adds ~5.4 s of JS/network work per app-open for a user with 100 own offers even when there are **zero** new messages (measured: "Fetch inboxes took 5.405s" + 100× "No new messages in inbox"); scales linearly with own offers.

**Root cause:** `fetchMessagesForAllInboxesAtom` (`state/chat/atoms/fetchNewMessagesActionAtom.ts:542–571`) maps every inbox in `messagingStateAtom` to `fetchAndStoreMessagesForInboxHandleNotificationsActionAtom` — one `retrieveMessages` API call per inbox (unbounded concurrency, but each is a full roundtrip + per-inbox handling). Task runs on every resume (`fetchMessagesForAllInboxesInAppLoadingTask.ts`). The throttle guard is 120 **milliseconds** (`fetchNewMessagesActionAtom.ts:546`) — effectively none; the log text suggests seconds were intended. Each inbox that does have messages triggers a full messagingState persist (finding 2).

**Fix sketch:** short term: raise the throttle to an intentional value, and skip inboxes with no expected activity. Proper fix: a batched server endpoint ("which of these inboxes have messages") so one roundtrip covers all inboxes.
**Effort:** medium (client) / large (server endpoint). **Risk — privacy flag:** a batch endpoint would let the server correlate all of a user's inboxes in a single request; today they're already sent from the same connection in a burst, but the API design should be reviewed against the linkability model before building it.

### 5. Chats tab switch costs up to ~1 s: ChatsList selector rebuilds every row's identity on any messaging-state change — CONFIRMED, medium-high

**User impact:** tab switch to Chats measured at max 1007 ms render (vs 297 ms baseline); 20 `Memo(ChatListItem)` × 37 ms + `Swipeable` × 28.5 ms all mount fresh. Also means **every incoming message remounts every chat row**.

**Root cause:** `components/InsideRouter/components/MessagesScreen/components/ChatsList.tsx:24–42` — `selectAtom(messagingStateAtom, ...)` has no equality function and wraps each chat in a new `{chat, lastMessage}` object per evaluation; `splitAtom` then regenerates all row atoms and `keyExtractor={atomKeyExtractor}` keys rows by atom instance, so FlashList sees all-new items — defeating both `React.memo(ChatListItem)` and recycling.

**Fix sketch:** give `selectAtom` an equality fn / select stable identities (chat ids), pass `splitAtom` a keyExtractor on `chat.id`, and key FlashList rows by chat id.
**Effort:** small. **Risk:** low; verify unread/last-message updates still propagate.

### 6. Chat open shows a blank message area for 1–2 s: chat FlashList re-keyed per message + unstable list props — CONFIRMED, medium

**User impact:** chat shell appears ~1.4 s after tap but history renders only at ~2–3.3 s (screenshots `loaded-chat-open-*.png`); profile shows the chat FlashList's ViewHolderCollection re-rendering 81× (total 812 ms, max 635 ms) and FlashList itself 42× during scroll. One chat also opened scrolled to mid-history (#7–#15) instead of the newest message.

**Root cause:** `components/ChatDetailScreen/atoms/index.tsx:143–149, 306` — `buildMessagesListData` rebuilds every item object per change and `splitAtom` + `atomKeyExtractor` (MessagesList.tsx:361) key rows by atom instance instead of the stable `item.key` the builder already computes → each appended message re-keys all rows. Contributing library-level issue: `@shopify/flash-list`'s ViewHolderCollection receives 5 freshly-created function props on every render (seen in all profiles: getLayout, getAdjustmentMargin, onCommitLayoutEffect, onCommitEffect, getChildContainerLayout), plus fresh `contentContainerStyle`/`onScroll`/`onContentSizeChange` passed to the list. `MessageItem` itself is correctly memoized (renders once).

**Fix sketch:** key `splitAtom` and FlashList rows by `item.key`; memoize items by message uuid; hoist/stabilize the list props we control; check the mid-history scroll against `maintainVisibleContentPosition`/initial-scroll-index logic; consider a FlashList upgrade/patch for the function-prop churn.
**Effort:** small–medium. **Risk:** low.

### 7. Contacts pipeline: full device-contacts reload + wholesale store rewrite on every resume, plus O(n²) dedupe — CONFIRMED (measured 2.8 s → 5.0 s), medium

**User impact:** +2.2 s of resume work at only 200 contacts; scales quadratically — real users with 2–5k contacts pay far more, and the identity churn invalidates the marketplace derived-atom chain (multiplying finding 3).

**Root cause:** `state/contacts/atom/loadContactsFromDeviceActionAtom.ts:37–71` runs on every resume and unconditionally `set(storedContactsAtom, ...)` with all-new object identities (no diff), triggering the full-blob MMKV rewrite (finding 2) and recomputation of `normalizedContactsAtom`, which dedupes with `Array.dedupeWith` — O(n²), ~14M comparisons at 5300 contacts (`contactsStore.ts:85–89`). `normalizeStoredContactsActionAtom.ts:96–105` also does a spread-in-reduce O(n²) partition on every screen focus before its early exit. (Good news confirmed statically: libphonenumber parsing and HMAC hashing are cached in `computedValues` and NOT redone per start.)

**Fix sketch:** diff before set (skip write when device contacts unchanged, preserve object identity for unchanged entries); Map-based dedupe; `Array.partition` instead of spread-reduce; Set-based `createImportedContactsForHashesAtom`.
**Effort:** small–medium. **Risk:** contact hashes feed offer visibility — behavior must stay identical; pure data-structure changes, no crypto.

### 8. Empty-marketplace 5 s poll runs the FULL refresh pipeline indefinitely — CONFIRMED (baseline: 12 firings/60 s; loaded: 0), medium

**User impact:** new users, and any user whose stored offers are all hidden (mine/expired/reported/no common friends — the gate is "nothing _visible_", not "nothing stored"), burn network + battery + JS time every 5 s while on the marketplace: 2+2×clubs requests per tick including POSTing all stored offer ids, O(N²) merge, and 2–3 full MMKV blob rewrites per tick.

**Root cause:** `components/InsideRouter/components/MarketplaceScreen/components/EmptyList.tsx:36, 217–221` (`EMPTY_MARKETPLACE_REFRESH_INTERVAL_MS = 5000`, `setInterval` → full `refreshOffersActionAtom`), mounted whenever `areThereOffersToSeeInMarketplaceWithoutFiltersAtom` is false. Confirmed by idle measurements: exactly-5 s cadence at baseline, zero firings with data.

**Fix sketch:** backoff (5 s → 30 s → 60 s), poll only when the store is truly empty, and skip the merge/state-write/removed-offers/owner-ensure steps when nothing was fetched.
**Effort:** small. **Risk:** low; keep the fast first-offer pickup for genuinely new users.

### 9. Self-sustaining owner-private-payload loop: re-encrypt + re-upload + re-download owned offers on every refresh — PLAUSIBLE, medium-high

**User impact:** for affected users (offers missing local `adminId`/`intendedConnectionLevel`), every refresh does per-offer ECIES encryption + a server write + re-download + re-decrypt — repeated crypto and network work that never converges, feeding the refresh costs in finding 3.

**Root cause (static, not directly measured):** `state/marketplace/atoms/ensureMyOffersHaveOwnershipInfoUploadedInPrivatepayloadForOwner.ts:13–42` uploads via `updateOwnerPrivatePayload` but discards the result (`Effect.ignore`) and never persists locally, while `mergeIncomingOffersToState.ts:46–47` explicitly refuses to update owned offers from the server — so the missing fields stay missing forever and the cycle repeats each refresh.

**Fix sketch:** persist the returned private payload into local state after a successful upload (or allow the merge to update owned offers' privatePart); skip the step when the filtered list is empty.
**Effort:** small. **Risk — crypto flag:** touches offer private-payload encryption/upload; verify the re-encrypted payload is byte-compatible with what other clients decrypt, and test with offers created by older app versions.

### 10. Per-message chat decryption is strictly sequential with a heavyweight legacy KDF (2× PBKDF2-2000 per message) — PLAUSIBLE (consistent with run-1 19.4 s message pull), medium

**User impact:** returning from offline with N pending messages costs N sequential ECDH + 2×PBKDF2 + HMAC + AES operations on the JS scheduling path — slow first sync and slow catch-up after inactivity.

**Root cause:** `packages/resources-utils/src/chat/retrieveMessages.ts:48–62` combines per-message decrypts with bare `Effect.all` (concurrency 1); each decrypt runs `eciesLegacyDecrypt` with two PBKDF2 derivations at 2000 iterations (`packages/cryptography/src/operations/eciesLegacy.ts:130–155`) plus ~4 JSON parse/Schema passes per plaintext (`decryptOffer`-style layering in `messageIO.ts`/`chatCrypto.ts`).

**Fix sketch:** pass `{concurrency: 4–8}` to `Effect.all`; cache derived keys per (privateKey, epk) pair; collapse redundant Schema passes. Longer term migrate the legacy KDF to HKDF.
**Effort:** small (concurrency) / large (KDF migration). **Risk — crypto flag:** any change beyond the concurrency option touches E2E message crypto; concurrency itself is safe (independent messages) but key-caching and KDF changes need cryptographic review and cross-version compatibility testing.

### 11. Startup fixed costs: all 14 locales (~3.4 MB) eagerly parsed, 17 side-effect imports pull the whole state graph (with double blob decodes) into bundle eval, first render gated behind session-load + ~1 s splash bounce — PLAUSIBLE, low-medium

**Root cause:** `packages/localization/src/translations.ts:1–73` (16 `unflatten` passes at module scope, imported by every screen via I18nProvider); `utils/inAppLoadingTasks/useInAppLoadingTasks.ts:9–25` bare side-effect imports defeating inline-requires; `AnimatedSplashScreen.tsx:161, 250, 257` (session load starts in useEffect, `BounceOut.duration(1000)` gates content). Measured native TTI was unchanged by data (as expected — these are constants), and dev-build absolute startup numbers are unreliable, hence the lower rank.

**Fix sketch:** lazy-load non-device locales; start `loadSession` at module scope; shorten/overlap the splash exit animation.
**Effort:** medium. **Risk:** low.

---

## Measurement caveats (dev/emulator noise — excluded from rankings)

- **exp.host unreachable on the emulator:** `refreshNotificationTokenOnResume` at 23–25 s in both runs, and most of the _constant_ ~43–45 s inner "Sync connections" step, are Expo-push-token DNS-failure timeouts — test-setup noise. The production-relevant residue is captured in finding 1 (no timeout around an inline token fetch).
- **Dev build overhead:** Metro, Hermes dev mode, react-devtools profiling, and verbose logging (per-task InAppLoadingTasks logs incl. full result serialization, `⏲️` benchmark logs, 1 s notification-stream retry logs) inflate all absolute numbers. Production strips `console` entirely (`setupAppLogs.ts:57–63`).
- **Production-relevant logging exceptions (kept in findings/backlog):** the AppLogs storage rewrites the entire accumulated log string per line with unbounded growth (`components/AppLogsScreen/utils/storage.ts:26–33`) — active whenever a user enables in-app logs in production; and `useConsumeNotificationStream.ts:318–328` eagerly pretty-JSON.stringifies every stream event before the debug-enabled check. Both are small fixes worth bundling.
- The baseline "5 s marketplace poll" is real code (finding 8) but only manifests for empty/all-hidden marketplaces.
- 400 of 600 seeded incoming offers visible (second-degree-only authors filtered) — plausibly intended marketplace behavior, not investigated further.

## Fix status

### Shipped in this PR (originally planned as PRs 1–5)

- ✅ **Connections sync (finding 1):** batched offer-to-connections write in syncConnections + Set for `deleteOrphanRecords` + timeout on `getNotificationTokenE`; fixed the 120 ms inbox throttle (finding 4); empty-marketplace poll backoff + no-op short-circuit (finding 8).
- ✅ **Storage helper (finding 2 a–d):** O(1) own-write detection, dropped redundant decode, no per-write schema rebuild, single startup decode + write coalescing in `atomWithParsedMmkvStorage`. Benefits every store at once.
- ✅ **Offers pipeline (findings 3, 9):** Map/Set merge, no-op refresh short-circuit, Set-based common-friends, Sentry report moved out of the getter; owner-private-payload loop fixed (crypto-reviewed).
- ✅ **Lists (findings 5, 6):** stable keys/identities for ChatsList and chat-detail list.
- ✅ **Contacts (finding 7):** resume-time diff, Map-based dedupe/partition.

### Remaining follow-up (larger / needs design)

- **Batched inbox-check endpoint** (finding 4 — needs privacy/linkability review).
- **Decrypt concurrency landed; KDF review/migration remains** (finding 10).
- **Sharded persistence** (finding 2e).
- **Startup locale/splash work** (finding 11).
