# Notification handling rewrite — context

> This document explains *why* we're rewriting notification handling and *what*
> we're trying to accomplish. For the catalog of notification types and their
> triggers see [`notification-types.md`](./notification-types.md). For the
> behavior of the *current* handlers (and the drift between them) see
> [`background-notification.md`](./background-notification.md).

## Goal

Collapse all push-notification handling into **one shared dispatcher** that runs
from both delivery paths (foreground and background), built **bottom-up** and
verified one notification type at a time on a real device until the whole thing
is proven working.

## Why

Today the same "given a notification payload, decide what to do" logic is
**duplicated in two places** and has drifted out of sync:

- `apps/mobile/src/utils/notifications/backgroundHandler.ts` →
  `processBackgroundMessage` (app backgrounded / killed)
- `apps/mobile/src/state/useHandleReceivedNotifications.ts` →
  `processNotification` (app foreground)

Both are long sequential `if (Option.isSome(decode(...)))` chains over the same
notification types, but they differ in ordering, fallbacks, and which types they
handle (e.g. `VexlProductNotificationData` only in the foreground hook). The
divergences are documented in
[`background-notification.md`](./background-notification.md). The result is messy,
buggy, and hard to reason about — fixing a bug in one path silently leaves the
other wrong.

## Target architecture

A single registry of handlers, where each notification type declares its
behavior **once**:

```
NotificationHandler = {
  decode: (payload) => Option<T>,
  handle: ({ payload, ctx }) => Effect<...>   // ctx = { source: 'foreground' | 'background', appActive }
}
```

Both entry points (background task + foreground listener) normalize their input
to the same payload shape and iterate the same registry. The **only** legitimate
difference between foreground and background is carried in `ctx` — e.g. the
`isInBackground` flag passed to offer re-encryption, or whether to show a local
OS notification vs. an in-app one. This kills the drift permanently and is a
natural fit for Effect.

### The two delivery paths (must stay; the dispatcher is shared)

- **Background task** — `TaskManager.defineTask(...)` +
  `Notifications.registerTaskAsync(...)`. Fires when the app is
  backgrounded/killed, and for silent data-only messages on Android. `defineTask`
  must run **synchronously at JS startup** (imported in `apps/mobile/index.js`)
  so a headless launch finds the task defined.
- **Foreground listener** — `Notifications.addNotificationReceivedListener(...)`.
  Fires while the app is active.

`apps/mobile/src/utils/notifications/extractDataFromNotification.ts`
(`extractDataPayloadFromNotification`) already normalizes both shapes
(`source: 'background'` vs `source: 'hook'`) into `{ payload, isHeadless }`. Reuse
it as the dispatcher's input layer rather than reinventing parsing.

## Approach: bottom-up, verify as we go

1. Establish raw visibility into **both** delivery paths for a **silent** and a
   **system** notification — which path fires, and whether it's headless.
2. Build the shared dispatcher skeleton (normalize → decode → handle via registry).
3. Migrate notification types **one at a time** into the registry, testing each
   on-device before moving on.
4. Add the foreground/background de-dup guard (during early testing we
   intentionally log both paths so we can observe them).
5. Once all types are migrated and verified, delete the old handlers and the
   now-redundant define/register glue.

## Dev loop: building & getting logs

Background tasks can't be tested in a dev build — they need a real install.

- Test on a **`stageEnv`** release build:
  `npx expo run:android --variant release -d` (applicationId `it.vexl.nextstaging`).
- On a stage build `console.*` is **not** stripped (no `transform-remove-console`),
  Hermes routes it to Android logcat under tag `ReactNativeJS`, and `setupAppLogs`
  restores native console methods (the `__DEV__ || isStaging` branch). So:
  - `adb logcat | grep '📳V2'` — live tail, including **background-task** logs
    (logcat is system-wide; the headless task logs under the same tag with a fresh
    PID, so filter by **tag, not PID**).
  - Keep the AppLogsScreen **custom-logging toggle OFF** — turning it on reroutes
    `console.*` into MMKV and only mirrors to native console in `__DEV__`, so you'd
    lose logcat.
- For the **detached** case (app swiped away, notification arrives minutes later
  with no USB), use **wireless adb** (`adb tcpip 5555` + `adb connect <ip>:5555`)
  or fall back to the existing MMKV log export/share (`saveLogsToDirectory`, with
  the `removeSensitiveData` anonymize option) for post-mortem capture.

## Privacy constraints (non-negotiable)

Notification logs contain decrypted payloads, public keys, and `trackingId`s —
exactly the data Vexl goes to great lengths *not* to be able to see. Any dev-only
log shipping (e.g. a local log server) must be:

1. **Env-gated so it cannot exist in a prod bundle** — guarded on `isStaging` /
   an `EXPO_PUBLIC_*` flag so it tree-shakes out of `prodEnv` builds (compile-time,
   not a runtime toggle).
2. **localhost / LAN only**, never a public endpoint.
3. Piped through `removeSensitiveData` before sending.

It must never run against a real user's device.

## References

- Notification type catalog & triggers: [`notification-types.md`](./notification-types.md)
- Current handler behavior & foreground/background drift:
  [`background-notification.md`](./background-notification.md)
- Payload schemas: `packages/domain/src/general/notifications/index.ts`
