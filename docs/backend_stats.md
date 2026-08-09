# Backend metrics

All backend services report metrics as `MetricsMessage`s pushed to a BullMQ queue. The metrics service consumes the queue and inserts each message into the `metrics` table (`name`, `uuid`, `value`, `timestamp`, `type`, `attributes` jsonb). The only exception is the notification interaction endpoint, which the metrics service writes to the table directly.

- `type` is `Increment` (event counter, `value` defaults to 1) or `Total` (gauge — absolute value at report time).
- Gauges are reported periodically by a background loop in each service.

**Keep this document in sync**: when a metric or its attributes change, or a new one is added, update this file.

## Common attributes

Frontend-triggered metrics include attributes extracted from the request's common headers (`commonMetricAttributesFromHeaders` in `packages/server-utils`):

| Attribute | Value | Fallback |
| --- | --- | --- |
| `appVersion` | client semver, e.g. `1.2.3` | `unknown` |
| `appVersionCode` | client version code number | `unknown` |
| `appPlatform` | `ANDROID` / `IOS` / `CLI` / `WEB` | `unknown` |
| `appSource` | store the app was installed from | `unknown` |
| `clientCountryPrefix` | phone country prefix of the user | `none` |

These are referred to as *common* in the tables below.

## user-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `NUMBER_OF_USERS_BY_COUNTRY` | Total | `countryPrefix` (`none` if unknown) | Gauge, every 60 s; count of rows in `users` per country. |
| `NUMBER_OF_USERS` | Total | — | Gauge, every 60 s; total count of users across all countries. |

## contact-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `USER_LOGGED_IN` | Increment | common + `countryPrefix`, `numberExists` | User registers with the contact service right after login. `numberExists` is true when a user with the same phone number already existed (login from a new device / re-login without account deletion). |
| `USER_REFRESH` | Increment | common | User refresh endpoint is called (app foregrounded / periodic refresh). |
| `USER_REACTIVATED` | Increment | common + `daysInactive` (int), `remindersReceived` (int), `daysSinceLastReminder` (int or `none`) | A returning user refreshes after being inactive longer than `CONTACT_CONSIDERED_AS_EXPIRED_FOR_METRICS_AFTER_DAYS` (default 30), or after having received at least one inactivity reminder (so reminder-driven returns below the window are counted too). |
| `COUNT_OF_UNIQUE_USERS` | Total | — | Gauge, every 60 s; users that have imported at least one contact. |
| `COUNT_OF_UNIQUE_CONTACTS` | Total | — | Gauge, every 60 s; distinct imported contacts. |
| `COUNT_OF_INACTIVE_USERS` | Total | — | Reported by the user-inactivity notification job; users whose `refreshed_at` is older than the inactivity threshold (or null). |
| `COUNT_OF_INACTIVE_USERS_BY_REMINDERS_SENT` | Total | `remindersSent` (int) | Reported alongside `COUNT_OF_INACTIVE_USERS`; inactive users grouped by how many inactivity reminders they have received so far. Rows from one report share a timestamp. |
| `INACTIVITY_NOTIFICATION_SENT` | Increment (value = user count) | `variant` (`FIRST`/`OFFERS_DEACTIVATED`), `notificationOrdinal` (int — which reminder in a row this was) | The user-inactivity notification job enqueued reminders; one message per (variant, ordinal) group. |
| `COUNT_OF_ACTIVE_USERS` | Total | — | Daily scheduled task (`REPORT_ACTIVE_USERS_CRON`, default 00:30 UTC); users refreshed within the active window (`ACTIVE_USER_WINDOW_DAYS`, default 30 days). |
| `COUNT_OF_ACTIVE_USERS_BY_COUNTRY` | Total | `countryPrefix` (`none` if unknown) | Reported alongside `COUNT_OF_ACTIVE_USERS`; active users grouped by their phone country prefix. Rows from one report share a timestamp, and countries with no active users are omitted. |
| `COUNT_OF_CONNECTIONS` | Total | — | Gauge, every 60 s; total user⇄contact connections. |
| `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS` | Increment | common + `clubUUid`, `contactsImported` | User joins a club (attribute says whether they imported contacts). |
| `CLUB_REPORTED` | Increment | common | Club member reports a club. |
| `CLUB_DEACTIVATED` | Increment | common | A report pushes a club over its report limit and it gets deactivated. |
| `NEW_APP_USER_NOTIFICATIONS_SENT` | Increment | `trackingId`, `metricVersion` | Currently unused — reporter exists but has no callers. |

## offer-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `OFFER_CREATED` | Increment | common + `countryPrefix` (the offer's country), `offerType` (`BUY`/`SELL`) | New offer is created. |
| `OFFER_MODIFIED` | Increment | common | Offer is updated. |
| `OFFER_REPORTED` | Increment | common + `offerId` | Offer is reported — both the contact-network and the club report endpoints report under this name. |
| `OFFER_PUBLIC_PART_DELETED` | Increment | common | Offer is deleted. |
| `TOTAL_BUY_OFFERS`, `TOTAL_SELL_OFFERS` | Total | `countryPrefix` (`none` if unknown) | Gauge, every 10 min; active offers (refreshed within last 30 days) per country. |
| `TOTAL_BUY_OFFERS_ACROSS_ALL`, `TOTAL_SELL_OFFERS_ACROSS_ALL`, `TOTAL_OFFERS_ACROSS_ALL` | Total | — | Gauge, every 10 min; sums of the above across countries. |
| `TOTAL_BUY_OFFERS_EXPIRED`, `TOTAL_SELL_OFFERS_EXPIRED` | Total | `countryPrefix` (`none` if unknown) | Gauge, every 10 min; offers not refreshed within the expiration period, per country. |
| `TOTAL_BUY_OFFERS_EXPIRED_ACROSS_ALL`, `TOTAL_SELL_OFFERS_EXPIRED_ACROSS_ALL`, `TOTAL_OFFERS_EXPIRED_ACROSS_ALL` | Total | — | Gauge, every 10 min; sums of the above across countries. |
| `TOTAL_OFFERS_FLAGGED_ACROSS_ALL` | Total | — | Gauge, every 10 min; non-expired offers with reports at or above the report threshold. |
| `MEAN_OFFER_VISIBILITY_PER_COUNTRY`, `MEDIAN_OFFER_VISIBILITY_PER_COUNTRY` | Increment (value = mean/median) | `countryPrefix` | Gauge-like, every 10 min; mean/median number of users an active offer is visible to (private parts per offer). |

## chat-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `MESSAGE_SENT` | Increment | common | A message is stored into an inbox — direct message, batch send, messaging request/cancel/approve/disapprove, or leave-chat message. |
| `REQUEST_SENT` | Increment | common | Messaging request is sent (V1 and V2 endpoints). |
| `REQUEST_CANCELED` | Increment | common | Messaging request is canceled (V1 and V2 endpoints). |
| `REQUEST_APPROVED` | Increment | common | Messaging request is approved. |
| `REQUEST_REJECTED` | Increment | common | Messaging request is disapproved. |
| `CHAT_CLOSED` | Increment | common | User leaves a chat. |
| `MESSAGE_FETCHED_AND_REMOVED` | Increment (value = count) | common + `messageAgeSeconds` | Client confirms pulled messages, which deletes them from the inbox. `messageAgeSeconds` is the average age of the removed messages (seconds since the server accepted them); `unknown` for legacy rows without a received timestamp. |
| `MESSAGE_EXPIRED` | Increment (value = count) | — | Expired-messages cleanup task deletes old undelivered messages. |
| `TOTAL_INBOXES` | Total | — | Gauge, every 60 s; total inboxes. |
| `TOTAL_INBOXES_WITH_UNREAD_MESSAGES` | Total | — | Gauge, every 60 s; inboxes that have undelivered messages waiting. |

## notification-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `NOTIFICATION_SENT` | Increment | `trackingId`, `clientVersion`, `clientPlatform`, `systemNotificationSent`, `sentAt` | A push notification is issued to a device. |
| `NOTIFICATION_PROCESSED` | Increment | common + `trackingId`, `processedAt` | Client reports it processed a received notification. |

## metrics-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `NOTIFICATION_INTERACTION_<notificationType>_<type>` | Increment (value = reported count) | common + `clientVersion`, `clientPlatform`, and optional `notificationsEnabled`, `backgroundTaskEnabled`, `trackingId`, `isVisible`, `systemNotificationSent` | Client reports a notification interaction. `notificationType` is `Chat` or `Network`; `type` is `ChatMessageReceived`, `BackgroundMessageReceived`, `NewConnectionsReceived`, or `UINotificationReceived`. Inserted into the db directly (not via the queue). |
