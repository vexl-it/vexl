# Churn (category 8)

## Merged

| Duplicate                             | Canonical                                                       |
| ------------------------------------- | --------------------------------------------------------------- |
| "Download to registration drop-off"   | "Onboarding completion and onboarding churn" (`acquisition.md`) |
| "Onboarding drop-off by step"         | "Onboarding completion and onboarding churn" (`acquisition.md`) |
| "Registration to activation drop-off" | "Time from registration to activation" (`acquisition.md`)       |
| "Activation to return drop-off"       | "Retention after activation" (`retention.md`)                   |
| "Marketplace to return drop-off"      | "Retention after activation" (`retention.md`)                   |
| "Chat to return drop-off"             | "Retention after opening a chat" (`retention.md`)               |
| "Club to return drop-off"             | "Retention after joining a Club" (`retention.md`)               |

## Category summary

- Every "no observed X within N days" metric is the complement of a cohort journey defined elsewhere: the onboarding funnel ("Onboarding completion and onboarding churn"), activation ("Time from registration to activation"), return after activation ("Retention after activation"), after first initiation ("Retention after opening a chat") and after first club join ("Retention after joining a Club"). A journey that never advanced by maturity day is the churn readout, labelled `unknown` on the dashboard, never "churned".
- What this file owns: the gap histogram between consecutive core actions ("Time from last meaningful action to churn", on `weeklyActivity`) and the derived cohort view "Time from registration to churn".
- "Marketplace actions before churn", "Chats opened before churn", "App sessions before churn" are rejected (README): a per-device record overwritten on every start is a standing device profile.
- "Churn by acquisition source" is deferred with the other acquisition-source metrics (Q9).
- Backend covers the population side: `USER_LOGGED_IN`, `USER_REFRESH`, `USER_REACTIVATED`, `COUNT_OF_INACTIVE_USERS`. Backend "inactive" means no `refreshUser` call (app not foregrounded), not a core action; the two populations are never mixed.

### Download to registration drop-off

Merged into "Onboarding completion and onboarding churn" (`acquisition.md`). Dashboard label: "enrolled first opens with no registration observed within 7 days", shown next to the store download trend, never joined to it.

### Onboarding drop-off by step

Merged into "Onboarding completion and onboarding churn" (`acquisition.md`). Dashboard label: share of the matured cohort that never advanced past each `step`, with `contactsImport = denied` shown separately from no report.

### Registration to activation drop-off

Merged into "Time from registration to activation" (`acquisition.md`). Dashboard label: "no activation observed within 7 / 30 days", the complement of the activation rate, not a count of people who abandoned Vexl.

### Activation to return drop-off

Merged into "Retention after activation" (`retention.md`). Dashboard label: complement of `return7d` / `return30d` on `activationCohort` ("no later core action observed within the window"); the 90-day window is not built.

### Marketplace to return drop-off

Merged into "Retention after activation" (`retention.md`). A first browse is nearly the same instant as onboarding completion, so no browse-enrolled variant is built.

### Chat to return drop-off

Merged into "Retention after opening a chat" (`retention.md`). Dashboard label: complement of `return7d` / `return30d` on `initiationCohort`.

### Club to return drop-off

Merged into "Retention after joining a Club" (`retention.md`). Dashboard label: three separate series from `clubJoinCohort`: no club visit observed ("Returning to a Club" `returnedToClub`), no club core action (`d7Club` / `d30Club`), no main core action (`d7Main` / `d30Main`).

### Churn by acquisition source

- **Status: deferred**. Open: Q9.
- **Where in the code**: no source concept. The install channel (`appSource`) is a request header that the analytics rows do not store, so it cannot serve as a segment either.

### Time from last meaningful action to churn

- **Status: planned**
- **Type**: aggregation `weeklyActivity` (week). Counters (cap 20): `gapD0To6`, `gapD7To29`, `gapD30To59`, `gapD60To89`, `gapGt90`.
- **Definition**: Replaced by the distribution of observed gaps between consecutive core actions, among returning instances. At each core action bucket the gap since `lastCoreActionAt` and bump the counter. Instances without a marker (fresh install, logout, MMKV loss) bump nothing. The `d30To59` and up counters are the reactivation count of "Dormant to returning users" seen from the aggregation side.
- **Where in the code**: `lastCoreActionAt` marker updated at the success of `createOfferActionAtom` and `sendRequestActionAtom`; MMKV loss detection in `apps/mobile/src/utils/mmkv/detectMmkvDataLoss.ts`. Backend counterpart at foreground level: `USER_REACTIVATED.daysInactive`.
- **Privacy notes**: bucket counters only, never the timestamps.

### Marketplace actions before churn

- **Status: rejected**. A per-device record overwritten on every start is a standing device profile (README).

### Chats opened before churn

- **Status: rejected**. Same record as "Marketplace actions before churn"; rejected for the same reason (README).

### App sessions before churn

- **Status: rejected**. Same record as "Marketplace actions before churn"; rejected for the same reason (README).

### Time from registration to churn

- **Status: planned**
- **Type**: derived on the dashboard from `registrationCohort` ("Time from registration to activation") and `activationCohort` ("Retention after activation"); no new signal.
- **Definition**: Cohort no-observed-return curves at the fixed 7 and 30 day windows: registration to activation, then activation to return. No individual churn date is ever assigned; only "state at maturity" per weekly cohort.
- **Where in the code**: nothing beyond "Time from registration to activation" and "Retention after activation".
- **Privacy notes**: none beyond the two journeys.
