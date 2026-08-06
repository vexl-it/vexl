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
| `USER_LOGGED_IN` | Increment | common + `countryPrefix` (of the verified number) | User completes phone number verification (login). |
| `NUMBER_OF_USERS_BY_COUNTRY` | Total | `countryPrefix` (`none` if unknown) | Gauge, every 60 s; count of rows in `users` per country. |
| `NUMBER_OF_USERS` | Total | — | Gauge, every 60 s; total count of users across all countries. |

## contact-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `USER_REFRESH` | Increment | common | User refresh endpoint is called (app foregrounded / periodic refresh). |
| `COUNT_OF_UNIQUE_USERS` | Total | — | Gauge, every 60 s; users that have imported at least one contact. |
| `COUNT_OF_UNIQUE_CONTACTS` | Total | — | Gauge, every 60 s; distinct imported contacts. ⚠️ Also (mis)used by the inactivity notification job to report the number of inactive users under this same name. |
| `COUNT_OF_CONNECTIONS` | Total | — | Gauge, every 60 s; total user⇄contact connections. |
| `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS` | Increment | common + `clubUUid`, `contactsImported` | User joins a club (attribute says whether they imported contacts). |
| `CLUB_REPORTED` | Increment | common | Club member reports a club. |
| `CLUB_DEACTIVATED` | Increment | common | A report pushes a club over its report limit and it gets deactivated. |
| `NEW_APP_USER_NOTIFICATIONS_SENT` | Increment | `trackingId`, `metricVersion` | Currently unused — reporter exists but has no callers. |

## offer-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `OFFER_CREATED` | Increment | common + `countryPrefix` (the offer's country) | New offer is created. |
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
| `REQUEST_REJECTED` | Increment (value 0) | common | Messaging request is disapproved. ⚠️ Reported with value 0, so it records the event but never increments. |
| `CHAT_CLOSED` | Increment | common | User leaves a chat. |
| `MESSAGE_FETCHED_AND_REMOVED` | Increment (value = count) | — | Client confirms pulled messages, which deletes them from the inbox. |
| `MESSAGE_EXPIRED` | Increment (value = count) | — | Expired-messages cleanup task deletes old undelivered messages. |
| `TOTAL_INBOXES` | Total | — | Gauge, every 60 s; total inboxes. |
| `TOTAL_INBOXES_WITH_UNREAD_MESSAGES` | Total | — | Gauge, every 60 s; inboxes that have undelivered messages waiting. |

## notification-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `NOTIFICATION_SENT` | Increment | `trackingId`, `clientVersion`, `clientPlatform`, `systemNotificationSent`, `sentAt` | A push notification is issued to a device. |
| `NOTIFICATION_PROCESSED` | Increment | `trackingId`, `processedAt` | Client reports it processed a received notification. |

## metrics-service

| Metric | Type | Attributes | Reported when |
| --- | --- | --- | --- |
| `NOTIFICATION_INTERACTION_<notificationType>_<type>` | Increment (value = reported count) | common + `clientVersion`, `clientPlatform`, and optional `notificationsEnabled`, `backgroundTaskEnabled`, `trackingId`, `isVisible`, `systemNotificationSent` | Client reports a notification interaction. `notificationType` is `Chat` or `Network`; `type` is `ChatMessageReceived`, `BackgroundMessageReceived`, `NewConnectionsReceived`, or `UINotificationReceived`. Inserted into the db directly (not via the queue). |
