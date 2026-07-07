# iOS Rich Chat Notifications (Notification Service Extension)

Status: implemented on branch `feat/ios-nse-chat-notifications`, PR [#2571](https://github.com/vexl-it/vexl/pull/2571). All review rounds addressed (Greptile 5/5). Not yet verified on a physical device.

## What this is

iOS previously showed only a generic, server-composed "you have a new message" alert for chat pushes, because the push payload contains no message content — only an opaque notification token. This feature adds a Notification Service Extension (NSE, the mechanism Signal uses): when the alert push arrives, the extension fetches the new messages from chat-service, decrypts them on-device, and rewrites the notification to show the sender name and message text before iOS displays it.

**The failure mode is always today's behavior.** On any miss — unknown token, unsupported key curve, network failure, timeout, locked keychain, malformed payload — the NSE delivers the original generic content. It can degrade only to the status quo.

## Design decisions

1. **Vexl tokens only.** The NSE acts only on payloads with `targetToken` (`vexl_nt_…`). Legacy `NotificationCypher` payloads bail to generic content (legacy cyphers are being removed).
2. **secp256k1 only.** Legacy secp224r1 inbox keys bail to generic content. Enforced at PEM parse time (PKCS#8 and SEC1 forms, including params-less SEC1 rejection).
3. **Strictly read-only server-side.** `retrieveMessages` gained an optional `markAsPulled` (default `true`). The NSE sends `false`: no pulled flags, no inbox metadata writes. "Seen" semantics belong exclusively to the JS app.
4. **Additive key bridge; MMKV stays the source of truth.** JS syncs copies of the vexl-token → inbox-private-key map into a shared keychain access group (`kSecAttrAccessibleAfterFirstUnlock`, so it works while the device is locked) and non-secret metadata (sender display names, chat-service URL, locale) into the App Group container. Declarative replace-all sync; purged on logout and on logged-out startup. No private keys ever land in the app-group file; no session credentials are synced (the NSE doesn't need them).
5. **No new backend metadata.** The push payload is unchanged and the NSE fetch looks like the existing background fetch. Lock-screen exposure is governed by the iOS system "Show Previews" setting (default: only when unlocked); no in-app setting.
6. **Swift crypto via `swift-secp256k1`** (21-DOT-DEV wrapper around bitcoin-core libsecp256k1) + CryptoKit. No hand-rolled curve math.

## Architecture

```
push (alert, mutableContent=true, data: {targetToken, sentAt, ...})
  │
  ▼
VexlNSE (apps/mobile/targets/vexl-nse) ── 20s deadline, exactly-once delivery
  │  NotificationService.swift → VexlNotificationCore.NotificationEnricher
  ▼
VexlNotificationCore (apps/mobile/native/VexlNotificationCore, SPM package)
  1. parse Expo userInfo envelope (body / dataString quirk)
  2. keychain lookup: vexlToken → inbox private key   ← written by vexl-nse-bridge
  3. POST createChallenge → ECDSA-sign (SHA256, DER, secp256k1)
  4. PUT retrieveMessages {markAsPulled: false} (5s timeouts)
  5. eciesLegacyDecrypt each message (AES-256-CTR + HMAC-SHA256, PBKDF2-SHA1)
  6. pick preview candidate by |message.time − push.sentAt|
  7. render: title = sender display name (app-group metadata), body = text,
     threadIdentifier parity with JS, userInfo marker vexlNseEnriched
```

Key components:

| Piece | Location | Role |
|---|---|---|
| NSE target | `apps/mobile/targets/vexl-nse/` | `UNNotificationServiceExtension`; thin orchestration, always-deliver guarantee (NSLock-guarded check-and-clear) |
| Swift core | `apps/mobile/native/VexlNotificationCore/` | Crypto, protocol, storage readers, rendering; testable via `swift test` without an Xcode project |
| Bridge module | `apps/mobile/modules/vexl-nse-bridge/` | Local Expo module (CocoaPod); writes keychain + app-group stores; `syncAll`/`clear` |
| JS sync | `apps/mobile/src/state/notifications/nseBridge/` | Assembles payload (secp256k1 filter, sender names via `getOtherSideData`), debounced sync on token-map/chat/session/locale changes |
| SPM link plugin | `apps/mobile/expo-plugins/with-nse-local-spm.js` | Links the local SPM package into the VexlNSE target; must stay registered **before** `@bacons/apple-targets` in `app.config.ts` |
| Server param | `packages/rest-api` chat contracts + `apps/chat-service` `retrieveMessages` | `markAsPulled: false` → read-only retrieve |
| Test vectors | `packages/cryptography/test-vectors/nse-test-vectors.json` | eciesLegacy/GTM decrypt + ECDSA vectors pinned to the TS reference; consumed by Swift tests |

## Crypto parity notes (hard-won)

- **Chat messages use `eciesLegacy`, not `eciesGTM`.** GTM is only for notification-token cyphers. Legacy scheme: `NNNAbase64` length-prefixed parts, PBKDF2-SHA1 (key + CTR IV), HMAC-SHA256 verified over the base64 ciphertext string, trailing `0x00` bytes stripped after decrypt.
- ECDH must use the **uncompressed** shared point and slice out X (bytes 1..33) — not the library default (SHA-256 of the point).
- TS ECDSA signatures are **high-S**; Swift verification low-S-normalizes before libsecp verify.
- PEM scalars may be stripped of leading zeros; left-pad to 32 bytes (covered by a dedicated test vector, `key4-leading-zero-109`).
- Regenerate vectors with `pnpm generate:nse-vectors` in `packages/cryptography` (ciphertexts/signatures are randomized per run — don't regenerate casually).

## Bridge storage contract

Constants are intentionally duplicated between the writer (`VexlNseBridgeModule.swift`, a CocoaPod that cannot link the local SPM package) and the reader (`NseBridgeConstants.swift`); **`BridgeContractTests` fails if they drift** — change both sides in lockstep.

- Keychain, service `it.vexl.nse.inboxKeys`: one generic-password item per token, account = `vexl_nt_…`, value = JSON `{privateKeyPemBase64, publicKeyPemBase64}`, shared access group, `AfterFirstUnlock`.
- App Group file `nse-metadata.json` (`group.<bundleId>.shared`, i.e. `group.it.vexl.next.shared` prod / `group.it.vexl.nextstaging.shared` staging): `{version, chatServiceUrl, notificationServiceUrl?, locale, senderNames[]}`.
- Enriched-notification marker: `vexlNseEnriched: "true"` (+ inbox/sender/type) in `userInfo.body` and `dataString`; JS cancel logic skips these, and `showChatNotification` dismisses them (error-tolerantly) before showing the richer local notification.

## ⚠️ Deployment ordering (hard constraint)

**Deploy chat-service before shipping any app build containing the NSE.** The server change is fully backward compatible and can go out immediately. If the order is reversed: the NSE sends no Vexl client-version header, so against an old server the request deterministically 500s at the `updateInboxMetadata` NOT-NULL write — inside the transaction, before any pulled-marking — and the NSE falls back to generic content. Harmless (log noise only), and deliberately kept: **do not add a client-version header to the NSE's `ChatApiClient` before the server ships**, or old servers would accept the request and mark messages pulled, enabling a message-loss race with `deletePulledMessages` (documented in `ChatApiClient.swift` and `contracts.ts`).

## Verification status

- `pnpm turbo:typecheck` / `turbo:lint` / `turbo:format`: 29/29 each
- chat-service: 73/73 (incl. read-only-retrieve regression tests: pulled flags and `client_version` proven untouched)
- cryptography: 81/81 (vector pin suite)
- Swift: `cd apps/mobile/native/VexlNotificationCore && swift test` — 60/60 (all shared vectors, secp224r1 + params-less SEC1 rejection, thread-id parity pinned against node crypto, end-to-end enricher test)
- `expo prebuild` smoke test: VexlNSE target, local-SPM link, and app-group entitlements verified in the generated project
- Reviews: internal multi-agent adversarial review (16 confirmed findings fixed), then PR bots — 9 comments triaged (8 fixed, 1 rebutted false positive), Greptile confidence 5/5

## Remaining before release

1. Deploy chat-service `markAsPulled` change to production (safe immediately).
2. EAS credentials sync — registers the `it.vexl.next.nse` bundle ID + App Group; extension declared via `extra.eas.build.experimental.ios.appExtensions`. Build image needs Xcode 16.3+ (swift-secp256k1 0.23.2).
3. Dev build on a physical device: full push → enrich flow (the bridge Expo module Swift is parse-checked only; the NSE has never run on-device), including locked-device delivery.
4. The new native target changes the fingerprint → new `runtimeVersion` for OTA updates.
5. Optional: dedicated hidden-previews localization string (placeholder currently reuses "New message"); regenerate the NSE localization snapshot (`node scripts/generateNotificationLocalizations.mjs`) when notification strings change — no CI drift check yet.
