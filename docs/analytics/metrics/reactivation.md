# Reactivation (category 9)

## Merged

| Duplicate                          | Canonical                      |
| ---------------------------------- | ------------------------------ |
| "Notification to user reactivated" | "Notification to reactivation" |

## Category summary

- Two "dormant" definitions stay separate on the dashboard. Backend dormancy = no `refreshUser` call for N days, measured by `COUNT_OF_INACTIVE_USERS`, `USER_REACTIVATED`, `INACTIVITY_NOTIFICATION_SENT`. Client dormancy = 30 days without a core action, known only from the local `lastCoreActionAt` marker.
- One client definition: the `reactivationEpisode` journey ("Dormant to returning users"), written once when a core action follows a gap of at least 30 days, carrying the gap, the action type, the club flag and, when the previous episode is known locally, its length ("Time from reactivation to next dormancy").
- "Notification to reactivation" is the `exposure` journey of `notifications.md` for `type = userInactivity` with `dormantAtBaseline`.
- "Dormant users" and "Reactivation rate" are dashboard compositions: backend totals for the operational view, client episode counts for the core view, never one divided by the other.
- "Reactivation by acquisition source" is deferred with acquisition source (Q9); "Sessions before reactivation" with session tracking (Q11).

### Dormant users

- **Status: planned**
- **Type**: backend (`COUNT_OF_INACTIVE_USERS`, `COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT`) plus the cohort no-observed-return view of "Retention after activation".
- **Definition**: Frontend reports cannot enumerate dormant instances (absent devices do not report). The backend count is the operational "not refreshed for 30 days" number; the client side shows return coverage per activation cohort. Neither is labelled an exact total of dormant core users.
- **Where in the code**: `queryAndReportNumberOfInactiveUsers` in `apps/contact-service/src/metrics.ts`, run by `notifyUsersAboutInactivity`.
- **Privacy notes**: none new.

### Dormant to returning users

- **Status: planned**.
- **Type**: journey `reactivationEpisode`, lifetime 7 days, written once (terminal at creation), day precision, country stored, upload at next app start. Fields: `gap` (`GapBucket`), `firstActionType` (`offerMain`, `offerBoth`, `requestMain`, `requestClub`), `clubMember`, `previousEpisode` (`GapBucket`, optional).
- **Definition**: At a core action, compare with `lastCoreActionAt`; a gap of at least 30 days opens one episode. Fresh installs, logouts and MMKV loss have no marker and open nothing. After the reactivating action the marker is updated, so the next action does not open another episode.
- **Where in the code**: the two core-action success points with the `lastCoreActionAt` and `lastReactivationAt` markers. Backend counterpart at foreground level: `USER_REACTIVATED` in `apps/contact-service/src/routes/user/refreshUser.ts`.
- **Privacy notes**: four enums on a row that lives 7 days; suppression applies to every cross-tab.

### Reactivation rate

- **Status: planned**
- **Type**: backend rate (`USER_REACTIVATED` over `COUNT_OF_INACTIVE_USERS` at period start, both refresh-based) and the client episode count of "Dormant to returning users" shown as a count, never as a rate.
- **Definition**: A client dormant denominator would need the rejected before-churn snapshot ("Marketplace actions before churn"), so the client side stays a count.
- **Where in the code**: both backend metrics in `apps/contact-service/src/metrics.ts`.
- **Privacy notes**: none.

### Time from becoming dormant to reactivation

- **Status: planned**.
- **Type**: journey `reactivationEpisode`, field `gap`.
- **Definition**: The gap bucket of the episode (`d30To59`, `d60To89`, `gt90`); the dashboard subtracts the 30-day threshold in the label. Unknown history is excluded by construction.
- **Where in the code**: as "Dormant to returning users".
- **Privacy notes**: bucket, never the day count.

### Actions after reactivation

- **Status: planned**.
- **Type**: journey `reactivationEpisode`, field `firstActionType`.
- **Definition**: The core action that opened the episode, by class. Marketplace opens before it are not reactivation; nothing after it is uploaded.
- **Where in the code**: as "Dormant to returning users"; classes from `coreAction.ts`.
- **Privacy notes**: category only.

### Reactivation by acquisition source

- **Status: deferred**. Open: Q9. The install channel (`appSource`) is a request header the analytics rows do not store, so it cannot substitute.

### Club user reactivation

- **Status: planned**.
- **Type**: journey `reactivationEpisode`, boolean `clubMember`.
- **Definition**: Current club membership at the reactivating action (`clubsToKeyHolderAtom` non-empty); "ever joined" is not used. Counts only; no club-member dormancy denominator.
- **Where in the code**: `clubsToKeyHolderAtom` (`apps/mobile/src/state/clubs/atom/clubsToKeyHolderV2Atom.ts`).
- **Privacy notes**: boolean only; the dashboard does not cross `clubMember` with `firstActionType = requestClub` and country at once.

### Notification to reactivation

- **Status: planned**.
- **Type**: journey `exposure` (source `notification`, `type = userInactivity`), fields `displayed`, `dormantAtBaseline`, outcomes `offerCreated`, `chatInitiated`. Canonical for "Notification to user reactivated".
- **Definition**: Enrol at receipt of an inactivity notification with the local dormancy snapshot; a core action within 7 days is the outcome. Recipients who never return stay at `received`, so the denominator is complete. Coverage is "delivered", not "targeted" (compare with `INACTIVITY_NOTIFICATION_SENT`); there is no holdout, so the number is correlation only.
- **Where in the code**: `handleUserInactivityNotification` in `apps/mobile/src/utils/notifications/notificationReceivedHandler/handlers/userInactivity.ts` (runs in the background without a loaded session; the enrolment is an MMKV write flushed with `flushAllScheduledMmkvWrites` and uploaded at the next start). `displayed` is false when `notificationPreferences.inactivityWarnings` suppressed the banner. "Opened" is not distinguishable from "received" for this type (no tap branch, no payload on the local banner).
- **Privacy notes**: never the `trackingId`; `dormantAtBaseline` is a boolean, not a gap; `variant` is not carried (the type is enough).

### Sessions before reactivation

- **Status: deferred**. Open: Q11. Renamed "sessions after reactivation and before the next dormancy"; needs the session tracker.

### Time from reactivation to next dormancy

- **Status: planned**.
- **Type**: journey `reactivationEpisode`, field `previousEpisode` (`GapBucket`).
- **Definition**: Written on the next episode, from local markers: `(lastCoreActionAt + 30 days) - lastReactivationAt`, bucketed. Returners only by construction, labelled "observed recurrence among returners". No long-lived episode is kept open for it.
- **Where in the code**: the `lastReactivationAt` marker set at "Dormant to returning users", read at the next "Dormant to returning users".
- **Privacy notes**: bucket only.
