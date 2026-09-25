# Retention

## Merged

| Duplicate                                  | Canonical                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| "Retention after first marketplace action" | "Retention after activation"                                            |
| "Chat opens per offer"                     | "Number of offers receiving a request" (`marketplace-and-liquidity.md`) |
| "Activation to return drop-off"            | "Retention after activation" (`churn.md` stub)                          |
| "Marketplace to return drop-off"           | "Retention after activation" (`churn.md` stub)                          |
| "Chat to return drop-off"                  | "Retention after opening a chat" (`churn.md` stub)                      |
| "Club to return drop-off"                  | "Retention after joining a Club" (`churn.md` stub)                      |

## Category summary

- Every metric is "enrol at milestone M, observe core activity in fixed windows relative to M". Three cohort journeys are owned here: `activationCohort` ("Retention after activation", "Repeat marketplace usage", "Repeat offer creation"), `initiationCohort` ("Retention after opening a chat", "Repeat chat usage") and the retention bits of `clubJoinCohort` ("Retention after joining a Club"). The registration bits ("D1 retention", "D7 retention", "D30 retention") live on `registrationCohort`, owned by `acquisition.md` "Time from registration to activation".
- All cohort journeys live 31 days, carry booleans and enums only, round `updatedDay` to the week, and upload their initial state at the next app start. Each milestone has its own random id; they are never chained. D90 is not built.
- "Average chats opened per user" and "Chat opens per active user" are monthly counters on `monthlyActivity`; "Chat opens per offer" is the owner-side offer window of "Number of offers receiving a request".
- Instances that registered before the release have no journey; logout and MMKV loss end a journey silently, and the dashboard reports `unknown`, never churn.

### D1 retention

- **Status: planned**.
- **Type**: journey `registrationCohort` (31 days), boolean `d1`.
- **Definition**: A core action between 24 and 48 hours after registration, one contribution per instance. Denominator = enrolled registrations, including instances that never report again.
- **Where in the code**: enrolment in `handleUserCreationActionAtom` with the `registeredAt` marker; the core-action success points compare `Date.now() - registeredAt` with the window and flip the bit.
- **Privacy notes**: the record exists from registration day; its initial upload is delayed so it cannot be timed against `USER_LOGGED_IN`.

### D7 retention

- **Status: planned**.
- **Type**: journey `registrationCohort`, boolean `d7`.
- **Definition**: A core action between 7 x 24 and 8 x 24 hours after registration. The "any core action by day 7" variant is the activation rate of "Time from registration to activation" for a new registrant and is not duplicated.
- **Where in the code**: as "D1 retention".
- **Privacy notes**: as "D1 retention".

### D30 retention

- **Status: planned**.
- **Type**: journey `registrationCohort`, boolean `d30`.
- **Definition**: A core action between 30 x 24 and 31 x 24 hours after registration. Mature, large cohorts only; this is not 30-day MAU.
- **Where in the code**: as "D1 retention"; the id is dropped locally after day 31.
- **Privacy notes**: 31 days is the lifetime cap for every journey in the system.

### D90 retention

- **Status: rejected**. Not built (README: 30-day journey lifetime cap; a 91-day id behaves like a device id).

### Retention after activation

- **Status: planned**
- **Type**: journey `activationCohort`, lifetime 31 days from the first core action, week precision, country stored, initial upload at next start. Fields: `activatedBy` (`offer`, `request`), `d7`, `d30`, `return7d`, `return30d`, `repeat30d`, `secondOfferMain30d`, `secondOfferBoth30d`. Canonical for "Retention after first marketplace action", "Activation to return drop-off", "Marketplace to return drop-off".
- **Definition**: Enrol at activation (the `activatedAt` marker). `d7` / `d30` are exact-day windows; `return7d` / `return30d` are any later core action on a later day within the window ("Activation to return drop-off"'s complement is their false share). Denominator = enrolled activators.
- **Where in the code**: the two core-action success points; `activatedAt` marker.
- **Privacy notes**: separate id from `registrationCohort`; the two are never joinable. `activatedBy` doubles the cohort space and is dropped by the dashboard when cohorts are small.

### Retention after first marketplace action

Merged into "Retention after activation". The first core action is activation; a browse-enrolled variant is not built.

### Retention after opening a chat

- **Status: planned**
- **Type**: journey `initiationCohort`, lifetime 31 days from the first successful request, week precision, country stored, initial upload at next start. Fields: `d7`, `d30`, `return7d`, `return30d`, `secondInitiation30d`. Canonical for "Chat to return drop-off".
- **Definition**: Baseline = first successful conversation initiation (note requests excluded). Overlaps with "Retention after activation" when activation happened through a request; the dashboard says so.
- **Where in the code**: `sendRequestActionAtom` success, first time (a local "has initiated" flag; `idsOfRequestedOffersAtom` is not reused).
- **Privacy notes**: third concurrent cohort journey per device, each with its own id.

### Retention after joining a Club

- **Status: planned**
- **Type**: journey `clubJoinCohort` (defined in `clubs.md` "Returning to a Club"), booleans `d7Main`, `d30Main`, `d7Club`, `d30Club`. Canonical for "Club to return drop-off".
- **Definition**: Exact-day windows after the first club join, main-class and club-class core actions as separate series. Differs from the "any visit" milestone of "Returning to a Club".
- **Where in the code**: the core-action success points, classes from `coreAction.ts`; enrolment as in section 6.6.
- **Privacy notes**: club definition: no country, delayed uploads, no club uuid.

### Repeat marketplace usage

- **Status: planned**
- **Type**: journey `activationCohort`, booleans `repeat30d`, `return30d`.
- **Definition**: `repeat30d` = at least two successful core actions within 30 days of activation (same day counts); `return30d` is the different-day flag. Distinct successful operations, not retries.
- **Where in the code**: as "Retention after activation".
- **Privacy notes**: booleans only.

### Repeat offer creation

- **Status: planned**
- **Type**: journey `activationCohort`, booleans `secondOfferMain30d`, `secondOfferBoth30d`.
- **Definition**: A second distinct successful creation within 30 days of activation, by creation class. Editing (`updateOfferActionAtom`) does not count; re-creation after deletion does. Activators by request are in the denominator; the dashboard filters on `activatedBy = offer` for a creator-only view.
- **Where in the code**: `createOfferActionAtom` success.
- **Privacy notes**: booleans only.

### Repeat chat usage

- **Status: planned**
- **Type**: journey `initiationCohort`, boolean `secondInitiation30d`.
- **Definition**: A second successful initiation on a different offer within 30 days of the first. Re-requests to the same offer are excluded by a local `offerId` comparison.
- **Where in the code**: `sendRequestActionAtom` success; `canChatBeRequested` in `OfferDetailScreen/index.tsx` is the re-request path.
- **Privacy notes**: boolean only.

### Average chats opened per user

- **Status: planned**
- **Type**: aggregation `monthlyActivity` (month), field `initiations` (`CountBucket`).
- **Definition**: Successfully initiated conversations per reporting instance per calendar month, as a bucket. Not an average over all registered people.
- **Where in the code**: `sendRequestActionAtom` success (new chat only). Backend `REQUEST_SENT` gives the monthly total, not the distribution.
- **Privacy notes**: bucket; `gt10` caps the tail.

### Chat opens per offer

Merged into "Number of offers receiving a request" (`marketplace-and-liquidity.md`). Dashboard label: owner-observed requests per enrolled offer in its first 7 days (`offersRequests0` ... `offersRequests6Plus`, `offersNotObserved` as unknown).

### Chat opens per active user

- **Status: planned**
- **Type**: derived on the dashboard from `monthlyActivity`: `initiations` over rows with `coreActive = true`.
- **Definition**: Initiations per reporting core-active instance in the month, labelled capped. Zero initiations remain possible for active creators.
- **Where in the code**: nothing beyond "Average chats opened per user" and "Daily weekly and monthly active users performing core marketplace actions".
- **Privacy notes**: as "Average chats opened per user".
