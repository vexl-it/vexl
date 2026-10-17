# Analytics definitions

The signals behind the dashboard views in `metrics.md`. Each client definition lives in `packages/analytics-definitions/src/definitions/<name>.ts`; how they are uploaded and stored is in `system.md`. Terms (core action, main / Club, activation, dormant) are the decisions in `metrics.md`.

| Signal             | Kind            | Lifetime / period       | Feeds views        |
| ------------------ | --------------- | ----------------------- | ------------------ |
| `onboarding`       | journey         | 37 days from first open | 1, 4, 5            |
| `activityDaily`    | aggregation     | day                     | 3                  |
| `activityWeekly`   | aggregation     | ISO week                | 2, 3, 4, 5, 6      |
| `activityMonthly`  | aggregation     | month                   | 3                  |
| `offer`            | journey         | 30 days from creation   | 2                  |
| `request`          | journey         | 14 days from sending    | 2, 7               |
| `reactivation`     | journey         | 7 days from return      | 4                  |
| `notificationOpen` | journey         | 1 day                   | 6                  |
| `prompt`           | journey         | 7 days from first shown | 6                  |
| Backend metrics    | `metrics` table | per report              | 1 to 7, as context |

## Shared rules

- Every field is optional unless marked required. An absent field means "has not happened". The dashboard reads a journey that ended with the field still absent as "no".
- Journeys longer than 7 days carry booleans and enums only and use `updatedDayPrecision: 'week'`. Shorter journeys and aggregations may carry capped counters.
- **Core action main / Club.** `createOfferActionAtom` success is main; it is also Club when the offer is shared to at least one Club. `sendRequestHandleUIActionAtom` success is Club when the offer reached the device only through Clubs (its `friendLevel` has `CLUB` and no contact degree), otherwise main. Re-requests on an existing chat and note requests do not count. Approving a request (`acceptMessagingRequestAtom` with approve) counts as main, also on an offer shared to Clubs (`mainAndClub`). These rules live in `coreAction.ts` in the definitions package (`createdOfferClass`, `sentRequestClass`, `approvedRequestClass`, `markCoreAction`) so every definition uses the same ones.
- Activity aggregations and every journey except `onboarding` start only while the user is logged in.

### Buckets

Shared enums in `buckets.ts`, each with a `bucket…` helper where the value is computed from a number or a date (`bucketRequestCount`, `bucketClubCount`, `bucketTenure`, `bucketDormancy`).

| Bucket                 | Values                                                                                                                                                                                  | Used by                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `DaysBucket`           | `d0`, `d1`, `d2To7`, `d8Plus`                                                                                                                                                           | `onboarding`                       |
| `DurationBucket`       | `under1h`, `1hTo1d`, `1dTo7d`, `over7d`                                                                                                                                                 | `offer`, `request`                 |
| `OffersVisibleBucket`  | `0`, `1to5`, `6to20`, `21to50`, `51plus`                                                                                                                                                | `onboarding`, `activityWeekly`     |
| `RequestCountBucket`   | `1`, `2to5`, `6plus`                                                                                                                                                                    | `offer`                            |
| `ClubCountBucket`      | `0`, `1`, `2`, `3plus`                                                                                                                                                                  | `activityWeekly`                   |
| `TenureBucket`         | `w0`, `w1`, `w2to3`, `w4`, `w5to12`, `w13`, `w14plus`                                                                                                                                   | `activityWeekly`                   |
| `DormancyBucket`       | `d30To60`, `d61To180`, `over180`                                                                                                                                                        | `reactivation`                     |
| `NotificationCategory` | `chatMessage`, `requestReceived`, `requestAnswered`, `tradeReminder`, `newOffers`, `marketplaceReady`, `clubAdmission`, `clubDeactivated`, `inactivityReminder`, `productNews`, `other` | `notificationOpen`, `reactivation` |
| `AfterOpenAction`      | `offerOpened`, `offerCreated`, `requestSent`, `chatOpened`                                                                                                                              | `reactivation`                     |

`TenureBucket` is the number of ISO weeks between the registration week and the current week. Single weeks `w1`, `w4` and `w13` are what the retention table needs; the other weeks are pooled.

`NotificationCategory` covers the notifications a user can open: chat pushes (by chat notification type), local notifications (trade reminder, new offers, marketplace ready, inactivity reminder) and the Club and product pushes. Silent pushes are never opened and have no category. Local notifications carry a data tag so their opens can be told apart: the inactivity reminder (`showUserInactivityNotification`), Club deactivation (`CLUB_DEACTIVATED`) and the chat message `type` on local chat notifications (request received or answered). Backend send-task types (`NOTIFICATION_SENT`) do not line up with these categories, so sent and opened are shown in separate tables.

## Client journeys

### `onboarding`

One per install, started on the first app open while logged out (`firstOpenAt` marker). Lifetime 37 days, week precision, no terminal state.

| Field                  | Type                                                     | Set when                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `step` (required)      | `opened`, `phoneSubmitted`, `codeVerified`, `registered` | Furthest step reached, never moves back. `opened` on start, `phoneSubmitted` after `initPhoneVerificationAtom` succeeds, `codeVerified` in `verifyPhoneNumberAtom`, `registered` when the account is created.                                                                                                            |
| `existingAccount`      | boolean                                                  | The verified number already had an account (re-login). The dashboard leaves these out of every new-user number from phone verification on; earlier steps cannot tell them apart.                                                                                                                                         |
| `registeredAfter`      | `DaysBucket`                                             | UTC calendar days from the first-open day to the `registered` day.                                                                                                                                                                                                                                                       |
| `contactsImport`       | `started`, `completed`, `skipped`, `denied`, `failed`    | `ContactsImportScreen`. `completed` only when at least one contact was imported.                                                                                                                                                                                                                                         |
| `firstMarketplaceLoad` | `OffersVisibleBucket`                                    | First successful `refreshOffersActionAtom` after registration, from the size of `offersToSeeInMarketplaceAtom`, counting main-marketplace offers only (own offers and offers whose `friendLevel` has `CLUB` but no `FIRST_DEGREE` or `SECOND_DEGREE` excluded). Records the data loaded, not that the user looked at it. |
| `offerOpened`          | boolean                                                  | First main marketplace offer detail opened.                                                                                                                                                                                                                                                                              |
| `activation`           | `offer`, `request`                                       | First main core action of the creating or requesting kind (approving does not activate), within 30 days of the `registeredAt` marker (checked on the device). Guarded by the `activatedAt` marker.                                                                                                                       |
| `activatedAfter`       | `DaysBucket`                                             | UTC calendar days from the registration day to the `activation` day.                                                                                                                                                                                                                                                     |
| `clubJoin`             | `beforeContactsImport`, `afterContactsImport`            | First successful `submitCodeToJoinClubActionAtom`, relative to `contactsImport = completed`.                                                                                                                                                                                                                             |
| `clubActivation`       | `offer`, `request`                                       | First Club core action of the creating or requesting kind.                                                                                                                                                                                                                                                               |
| `coreActionD1`         | boolean                                                  | Any core action on the day after the registration day.                                                                                                                                                                                                                                                                   |
| `coreActionD7`         | boolean                                                  | Any core action on days 7 to 13 after registration.                                                                                                                                                                                                                                                                      |
| `coreActionD30`        | boolean                                                  | Any core action on days 28 to 34 after registration.                                                                                                                                                                                                                                                                     |

The day windows count from the registration day, but the journey dies 37 days after first open. When registration happened more than 2 days after first open, the D30 window does not fit and the field stays absent; the dashboard shows those as `unknown`, not as churn. The same clip shortens the 30-day activation window when registration happened more than 7 days after first open.

Rows stay `country_prefix = none` until the `registered` upload (`system.md` 6.8), so with a country filter the view 1 steps start at `registered`.

View 1 steps: first open and phone number entered are `step` (re-logins included); from phone verified on, rows with `existingAccount` are left out. Reached contact import is any `contactsImport` value (including `skipped`), contacts imported is `completed`, marketplace loaded is `firstMarketplaceLoad` present, saw at least 1 main offer is `firstMarketplaceLoad` other than `0`. Activated in Clubs only is `clubActivation` without `activation`.

### `offer`

One per offer created, on the creator's device. Lifetime 30 days, week precision.

| Field                  | Type                  | Set when                                                                         |
| ---------------------- | --------------------- | -------------------------------------------------------------------------------- |
| `offerType` (required) | `buy`, `sell`         | On creation.                                                                     |
| `class` (required)     | `main`, `mainAndClub` | On creation.                                                                     |
| `firstRequestAfter`    | `DurationBucket`      | First request received for this offer.                                           |
| `requestsReceived`     | `RequestCountBucket`  | Updated on every request received.                                               |
| `firstAnswerAfter`     | `DurationBucket`      | The creator's first approve or reject, measured from the first request.          |
| `removed`              | boolean               | The creator deleted the offer. Removed offers stop counting as "no request yet". |

`requestsReceived` and `firstAnswerAfter` feed no dashboard card yet.

### `request`

One per request sent (same counting rule as the core action), on the requester's device. Lifetime 14 days, week precision (the shared rule for journeys over 7 days), no terminal state.

| Field              | Type                                | Set when                                                                            |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `class` (required) | `main`, `club`                      | On sending.                                                                         |
| `outcome`          | `approved`, `rejected`, `cancelled` | The answer arrives, or the requester cancels. Absent after 14 days means no answer. |
| `answerAfter`      | `DurationBucket`                    | Time from sending to `approved` or `rejected`.                                      |
| `bothWrote`        | boolean                             | After approval, at least one message sent and one received in the chat.             |

### `reactivation`

Started when the app comes to the foreground and the `lastForegroundAt` marker is 30 or more days old, while logged in. The marker is set only on AppState `active`; `getLastTimeAppWasRunning` cannot be used, because it is overwritten on mount and by iOS background launches. Lifetime 7 days, day precision, no terminal state (terminal states are `step` values and this journey has no `step`); `coreAction` is the outcome.

| Field                   | Type                               | Set when                                                     |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `dormantFor` (required) | `DormancyBucket`                   | On start.                                                    |
| `openedFrom` (required) | `NotificationCategory` or `direct` | On start, from the notification that opened the app, if any. |
| `firstAction`           | `AfterOpenAction`                  | First of these actions after the return.                     |
| `coreAction`            | boolean                            | A core action within 7 days.                                 |
| `clubMember`            | boolean                            | On start, the install is in at least one Club.               |

Dormancy is detected on the device at the moment of return. No background task is needed; the dormant pool comes from the backend.

### `notificationOpen`

Started when the user opens the app from a notification (`useHandleNotificationOpen`). Lifetime 1 day, day precision. A new open while one is running replaces nothing, it starts a new instance.

| Field                                                      | Type                   | Set when                                     |
| ---------------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `category` (required)                                      | `NotificationCategory` | On start.                                    |
| `offerOpened`, `offerCreated`, `requestSent`, `chatOpened` | boolean each           | The action happened before the journey ends. |

### `prompt`

One per prompt, for in-app prompts that ask the user to do something. Started on the first display and kept until `outcome` or the 7-day expiry, so a banner that re-renders does not start a new one. Day precision. `promptId` is an enum (a new prompt bumps `schemaVersion`). Prompts that ship today: `importContacts`, `importNewContacts`, `missingProductCategories`, `enableNotifications`, `enableBackgroundRefresh`, `createOffer` (the marketplace banners in `MarketplaceFirstOfferBanner`). `ReencryptOffersSuggestion` and `DonationPrompt` are not tracked.

| Field                 | Type                  | Set when                                                                                |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `promptId` (required) | enum                  | On display.                                                                             |
| `outcome`             | `dismissed`, `tapped` | The user closes the prompt or taps its button. Absent means it was left without either. |
| `targetReached`       | boolean               | The action the prompt asks for happened within 7 days.                                  |

## Client aggregations

All three activity aggregations are created on the first foreground of the bucket while logged in, and on login or registration. A row existing means the app was opened in that bucket. Unique counts (DAU, WAU, MAU) need one row per period, because rows of different buckets cannot be linked; that is why there are three.

### `activityDaily` and `activityMonthly`

| Field            | Type    | Set when                          |
| ---------------- | ------- | --------------------------------- |
| `coreActionMain` | boolean | A main core action in the bucket. |
| `coreActionClub` | boolean | A Club core action in the bucket. |

### `activityWeekly`

| Field                  | Type                    | Set when                                                                                                                                                                                                                             |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tenure` (required)    | `TenureBucket`          | On creation, from the `registeredAt` marker. The marker is set only for a new account, so a re-login (`existingAccount`) and installs that registered before the marker existed report `w14plus`; `w0` is genuine new registrations. |
| `coreActionMain`       | boolean                 | A main core action in the week.                                                                                                                                                                                                      |
| `coreActionClub`       | boolean                 | A Club core action in the week.                                                                                                                                                                                                      |
| `activeDays`           | capped counter, max 7   | Bumped on the first foreground of each UTC day.                                                                                                                                                                                      |
| `offersCreated`        | capped counter, max 20  | `createOfferActionAtom` success.                                                                                                                                                                                                     |
| `requestsSent`         | capped counter, max 50  | Each counted request.                                                                                                                                                                                                                |
| `requestsApproved`     | capped counter, max 50  | Each approval by this install.                                                                                                                                                                                                       |
| `offersOpened`         | capped counter, max 200 | Offer detail opened, main or Club.                                                                                                                                                                                                   |
| `offersVisible`        | `OffersVisibleBucket`   | First successful marketplace load of the week, main-marketplace offers only, as in `onboarding.firstMarketplaceLoad`. Absent means the marketplace was not loaded this week.                                                         |
| `notificationsAllowed` | boolean                 | OS notification permission at the first foreground of the week.                                                                                                                                                                      |
| `clubs`                | `ClubCountBucket`       | Club memberships at the first foreground of the week.                                                                                                                                                                                |

Empty-marketplace rate in view 2: rows with `offersVisible = 0` divided by rows with `offersVisible` present, per week and country.

Long-term retention in view 4: the cohort is the `tenure = w0` rows of a registration week; W1, W4 and W13 are the `w1`, `w4` and `w13` rows 1, 4 and 13 weeks later with `coreActionMain` or `coreActionClub`. Coarser cohorts (month, quarter) add up their weeks.

Privacy trade-off of `tenure`. A weekly row with `w0`, `w1`, `w4` or `w13` names the install's registration week. Rows of one registration week can then be grouped across weeks, in a small country down to a handful of installs. We accept it because it is the only way to get week-13 retention without an id: the buckets pool every other week, and the 20-install suppression applies on every read. Do not add further per-install history fields to this row.

## Backend metrics

The existing server metrics (`docs/backend_stats.md`) live in the `metrics` table of the same metrics database as `analytics_states`, so the backoffice reads both over the one read-only connection. How a metric is read depends on its type:

- **Increment** (counter): `SUM(value)` per UTC day, ISO week, month or quarter of `timestamp`, grouped by the country attribute named below.
- **Total** (gauge, reported on a schedule): the last report in the bucket. Metrics that report one row per country in one go share a timestamp, so take every row of the latest timestamp in the bucket.

Backend numbers cover all users; client rows cover reporting instances. They are never combined into one ratio, and every backend number is labelled "all users". Ratios within one side are fine: the weekly reactivation rate is `USER_REACTIVATED` with `daysInactive >= 30` (all countries and platforms) divided by `COUNT_OF_INACTIVE_USERS` at the start of the week (contact-service reports it daily at 00:00 UTC from the inactivity job, `PROCESS_USER_INACTIVITY_CRON`, so take the Monday report). That pool uses `INACTIVITY_NOTIFICATION_AFTER_DAYS` (30 in dev), which must stay 30 in production for the two to match. Country breakdowns of backend numbers use the same 20 minimum.

Platform comes from `appPlatform` (common attributes) or `clientPlatform`; gauges have none, so the platform filter does not apply to them.

| Metric                                       | Read                                                        | Shows                                                                       | Country attribute                              | Platform         | Views |
| -------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- | ---------------- | ----- |
| `USER_LOGGED_IN` with `numberExists = false` | sum                                                         | new registrations                                                           | `countryPrefix`                                | `appPlatform`    | 1     |
| `TOTAL_BUY_OFFERS`, `TOTAL_SELL_OFFERS`      | last value                                                  | active offers by type, now and at each period's end                         | `countryPrefix`                                | none             | 2     |
| `OFFER_CREATED`                              | sum                                                         | offers created by type                                                      | `countryPrefix` (offer's country), `offerType` | `appPlatform`    | 2     |
| `MEDIAN_OFFER_VISIBILITY_PER_COUNTRY`        | last value (an Increment reported as a gauge, never summed) | users an offer reaches, per country; never merged, so `other` shows nothing | `countryPrefix`                                | none             | 2     |
| `REQUEST_SENT`                               | sum                                                         | requests sent                                                               | `clientCountryPrefix`                          | `appPlatform`    | 2     |
| `COUNT_OF_ACTIVE_USERS_BY_COUNTRY`           | last value per week                                         | users refreshed in the last 30 days                                         | `countryPrefix`                                | none             | 3     |
| `COUNT_OF_INACTIVE_USERS`                    | last value per week; the rate uses the value at week start  | dormant pool                                                                | none                                           | none             | 4     |
| `USER_REACTIVATED` with `daysInactive >= 30` | sum                                                         | returns after 30+ days inactive; weekly, all countries, for the rate        | `clientCountryPrefix`                          | `appPlatform`    | 4     |
| `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`     | sum                                                         | Club joins                                                                  | `clientCountryPrefix`                          | `appPlatform`    | 5     |
| `NOTIFICATION_SENT` with `channel = push`    | sum over the whole range                                    | push notifications sent by `sendTaskType`                                   | none                                           | `clientPlatform` | 6     |
| `TRADE_FEEDBACK_SUBMITTED`                   | sum; the positive share is `positive = true` over all rows  | chat ratings submitted and positive                                         | `clientCountryPrefix`                          | `appPlatform`    | 7     |

Never group by `clubUUid` (decision 13), `offerId` or `trackingId`.

`sendTaskType` on `NOTIFICATION_SENT` is the `SendMessageTask` tag: `NewChatMessageNoticeSendTask`, `NewUserNoticeSendTask`, `NewClubUserNoticeSendTask`, `UserAdmittedToClubNoticeSendTask`, `UserInactivityNoticeSendTask`, `UserLoginOnDifferentDeviceNoticeSendTask`, `ClubFlaggedNoticeSendTask`, `ClubExpiredNoticeSendTask`, `NewContentNoticeSendTask`, `VexlProductNotificationSendTask`. It is reported for every channel; view 6 reads `channel = push` only. Rows from before the attribute existed have no `sendTaskType`. These types do not line up with the client's `NotificationCategory`, so view 6 shows sent and opened in separate tables.

`TRADE_FEEDBACK_SUBMITTED` comes from feedback-service, which keeps the ratings in its own database. It reports once per `formId`, when stars are first set, for type `trade` only, with the common attributes plus `positive` (stars >= 4). It is a chat rating, not a report of a completed trade. No stars, objections, text or `formId` go into the metric. There are no rows from before it was deployed.
