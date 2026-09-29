# Sessions

## Merged

| Duplicate                                         | Canonical                     |
| ------------------------------------------------- | ----------------------------- |
| "Average time spent in app per day week or month" | "Session duration" (deferred) |

## Category summary

- The whole category is deferred behind Q11: the app has no session concept, and every metric here needs a tracker that runs on each foreground and background transition, checkpoints foreground seconds to MMKV every 30 seconds (immediate-save atom; the OS kills apps without a callback), and keeps a short ring of session starts. `useAppState` (`apps/mobile/src/utils/useAppState.ts`) and the `setLastTimeAppWasRunningToNow` heartbeat in `App.tsx` are the hook points if it is built.
- If built: "Sessions per user", "Sessions per active user", "Session frequency", "Session duration", "Session depth" are histogram counters on `weeklyActivity` (session count bucket, duration histogram, depth histogram by class, median gap bucket); "Single-session users" and "Repeat-session users" are one `firstOpenCohort` journey (7 days from first open); "Sessions before first marketplace action" and "Sessions before first chat" are one-shot buckets written on `registrationCohort` at activation and at first initiation. "Sessions before churn" is not measurable as proposed and the returner-only alternative is covered by "Sessions before reactivation".
- Foreground time cannot exclude idle time (no global touch listener); the published definition would say "foreground time".

### Sessions per user

- **Status: deferred**. Open: Q11. Would be a session count bucket (`1`, `2To5`, `6To10`, `11Plus`) on `weeklyActivity`.

### Sessions per active user

- **Status: deferred**. Open: Q11. Same bucket filtered on `coreActive`.

### Session frequency

- **Status: deferred**. Open: Q11. Median gap between session starts as one bucket per instance per month.

### Session duration

- **Status: deferred**. Open: Q11. Foreground-time histogram per week (under 1, 1 to 5, 5 to 15, over 15 minutes, plus `incomplete`). Canonical for "Average time spent in app per day week or month".

### Session depth

- **Status: deferred**. Open: Q11. Successful core actions per session as a histogram, main and club classes separately.

### Single-session users

- **Status: deferred**. Open: Q11. Complement of "Repeat-session users" on the same `firstOpenCohort` journey; never-returning instances are `unknown`, not single-session.

### Repeat-session users

- **Status: deferred**. Open: Q11. Boolean "second session within 7 days of first open".

### Sessions before first marketplace action

- **Status: deferred**. Open: Q11. One bucket (`1`, `2To3`, `4Plus`) written on `registrationCohort` at activation.

### Sessions before first chat

- **Status: deferred**. Open: Q11. Same bucket written at first initiation.

### Sessions before churn

- **Status: deferred**. Open: Q11. Not measurable as proposed (absent phones never deliver a final count); the returner-only alternative is "Sessions before reactivation", and churn volume itself is backend (`COUNT_OF_INACTIVE_USERS`, `USER_REACTIVATED`).
