# Active users

## Merged

| Duplicate | Canonical |
| --------- | --------- |
| none      |           |

## Category summary

- Daily active users are backend only: the contact-service refresh metric, extended with shorter windows. Client records carry no per-day bits.
- Weekly and monthly "engaged" and "core active" come from two aggregation records defined here: `weeklyActivity` ("Weekly active users") and `monthlyActivity` ("Monthly active users"). Both records are also the home of counters other files use (see `docs/analytics/definitions-index.md`).
- `engaged` = at least one foreground marketplace load, offer detail open, chat open or core action in the bucket. `coreActive` = at least one core action. Club core activity is the `coreClub` monthly bit and the `offersCreatedBoth` / `requestsSentClub` weekly counters.
- Signal sites: `refreshOffersActionAtom` success from `MarketplaceScreenContent` or `ClubOffersScreen` (not from the background task or resume task, so hook the screens); `OfferDetailScreen` mount; `ChatDetailScreen` mount via `useNavigateToChatDetail`; success of `createOfferActionAtom`, `sendRequestActionAtom`, `submitCodeToJoinClubActionAtom`.
- Reporting on the next app start means a device active in week N reports week N only if it comes back within the settle period; the background flush shrinks that gap.

### Daily active users

- **Status: planned**.
- **Type**: backend. `COUNT_OF_ACTIVE_USERS` and `COUNT_OF_ACTIVE_USERS_BY_COUNTRY` with a 1-day window added to the daily job.
- **Definition**: Users whose `users.refreshed_at` falls in the window, that is "opened the app while logged in". The stricter "engaged" definition exists at week and month granularity only ("Weekly active users", "Monthly active users"); no daily engaged series is built.
- **Where in the code**: `refreshUser` is called on every cold start (`apps/mobile/src/state/session/loadSession.ts`) and every foreground (`apps/mobile/src/state/refreshUserOnContactServiceInAppBackgroundTask.ts`); the job lives in `apps/contact-service/src/metrics.ts` (`REPORT_ACTIVE_USERS_CRON`, `ACTIVE_USER_WINDOW_DAYS`).
- **Privacy notes**: none new; the gauge has no per-user data.

### Weekly active users

- **Status: planned**.
- **Type**: mixed. Backend: 7-day window on the same job (label "rolling"). Client: aggregation `weeklyActivity` (week), booleans `engaged`, `coreActive`. Counters on the same record: `offersCreatedMain`, `offersCreatedBoth`, `requestsSentMain`, `requestsSentClub`, `rerequests` ("Offers created", "Offers reacted to"), the import counters ("Contact import started", "Contact import completed") and the gap counters ("Time from last meaningful action to churn"); all cap 20.
- **Definition**: Engaged instances per UTC calendar week, one row per reporting instance per week. Calendar weeks replace rolling WAU on purpose; daily counts cannot be summed into unique weekly counts.
- **Where in the code**: the signal sites in the summary set `engaged`; the core-action sites set `coreActive`. Record handling via `setField` and `bumpCounter` (system.md "Club offers created").
- **Privacy notes**: no per-day bits. Country is a row column; a week with `engaged` alone is low information, the counters add pattern bits, which is why they are capped and the dashboard suppresses small groups.

### Monthly active users

- **Status: planned**.
- **Type**: mixed. Backend: the existing rolling 30-day `COUNT_OF_ACTIVE_USERS`. Client: aggregation `monthlyActivity` (month), booleans `engaged`, `coreActive`, `coreMain`, `coreClub`, plus `initiations` (`CountBucket`, "Average chats opened per user").
- **Definition**: Engaged instances per calendar month, one row per reporting instance per month. Weekly rows cannot be deduplicated into a month because their ids are independent, hence the separate record. A month completes late: devices not active at month end upload at their next start.
- **Where in the code**: same signal sites as "Weekly active users", second record.
- **Privacy notes**: booleans and one bucket; the least pattern-bearing record in the system.

### Daily weekly and monthly active users performing core marketplace actions

- **Status: planned**
- **Type**: aggregation. `weeklyActivity.coreActive` and the class counters for the week; `monthlyActivity.coreActive`, `coreMain`, `coreClub` for the month. No daily series.
- **Definition**: Core action = successful offer creation or messaging request (re-requests and note requests excluded). "Main" = creation class `main` or request class `main`; "club" = creation class `both` or request class `club`; club join is not a core action but sets `clubJoins` on `clubActivityMonthly` ("Club joins"). Per-task detail at week level comes from the counters (`offersCreated* > 0`, `requestsSent* > 0`).
- **Where in the code**: `createOfferActionAtom` success (after `set(offersAtom, ...)`), `sendRequestActionAtom` success (after `sendMessagingRequest` resolves); `accountStatsAtom.postedOffers` (`apps/mobile/src/state/accountStatsAtom.ts`) is the existing pattern for a persisted counter at that point.
- **Privacy notes**: the weekly record has no per-task-per-day bits; that combination was the fingerprint risk and is gone with the no-per-day-bits decision.

### Ratio of weekly active users to monthly active users

- **Status: deferred**. CSV decision: defer. Nothing is collected; if revived it is a dashboard quotient of "Weekly active users" and "Monthly active users" for weeks fully inside the month, with the same engagement definition and population on both sides, labelled a calendar-period comparison.
