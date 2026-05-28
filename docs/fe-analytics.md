# Frontend Analytics

This document is the frontend event catalog for events reported by the mobile
app through `reportFrontendEventActionAtom` and the metrics service
`/report/frontend-event` endpoint.

The current reporting shape sends only:

- `id`: random UUID generated for this single event. The backend uses it for
  idempotency.
- `analyticsId`: anonymous frontend analytics identifier stored locally and used
  to link events from the same login/device context.
- `attributes`: optional JSON attributes. Avoid attributes unless a metric needs
  them and they pass the privacy rules below.
- `date`: event timestamp randomized by plus/minus 30 minutes before sending.
- `event`: one string literal from `FrontendEvent`.

The metrics service stores each event as an increment metric with generic app
headers (`client_version`, `client_semver`, `client_platform`, `app_source`,
`language`, `is_developer`). Event names should describe countable frontend
actions. Cohorts, retention, churn, and active counts are BI/backend
aggregations over these events, grouped by `analyticsId`.

Metric `attributes` are persisted as JSONB with snake_case keys. The app
metadata keys above are server-derived from common request headers and are
reserved; frontend payload attributes must not use them or their old camelCase
aliases (`clientVersion`, `clientSemver`, `clientPlatform`, `appSource`,
`isDeveloper`).

Do not report phone numbers, contact data, public keys, message ids, exact
coordinates, or other user-identifying values from FE analytics events.

## Event Catalog

### Implemented Events

These events are emitted by the app and should stay in the catalog.

| FE event | Stored metric | Report when | Main use |
| --- | --- | --- | --- |
| `appStartedFirstTime` | `FE_APP_STARTED_FIRST_TIME` | The app creates or restores the local analytics ID for the first time. | Anonymous first-start/install baseline. |
| `loginFinished` | `FE_LOGIN_FINISHED` | Registration/login flow finishes successfully. | `registration_completed_count`, `registered_count`, registered user cohorts. |
| `offerCreated` | `FE_OFFER_CREATED` | A new offer is successfully published. | `offer_created_count`, `offer_creators_count`, offer creator cohorts. |
| `offerRequested` | `FE_OFFER_REQUESTED` | User sends an initial request for someone else's offer. | Request funnel. |
| `offerRerequested` | `FE_OFFER_REREQUESTED` | User sends another request for an offer that was previously requested, denied, cancelled, or closed. | Request retry funnel. |
| `offerRequestAccepted` | `FE_OFFER_REQUEST_ACCEPTED` | Offer owner accepts an incoming request. | Request funnel acceptance. |
| `offerRequestDenied` | `FE_OFFER_REQUEST_DENIED` | Offer owner denies an incoming request. | Request funnel drop-off. |
| `offerRequestAcceptedByOtherSide` | `FE_OFFER_REQUEST_ACCEPTED_BY_OTHER_SIDE` | Requesting user receives the approval message from the offer owner. | Delivery/UX confirmation; do not use together with `offerRequestAccepted` for chat counts or it will double count. |
| `chatClosed` | `FE_CHAT_CLOSED` | User closes a chat that was not already closed locally. | Chat lifecycle and chat churn context. |
| `appOpened` | `FE_APP_OPENED` | App becomes active from cold start or background. Report once per foreground session, not on every render. | `app_opened_count`, active user and churn cohorts. |
| `sessionStarted` | `FE_SESSION_STARTED` | App becomes active from cold start or background, but only if the last reported `sessionStarted` for this `analyticsId` was more than 10 minutes ago. Persist the last reported timestamp locally so app restarts do not bypass the throttle. | Session count, active user and churn cohorts when session-based activity is preferred over raw app opens. |
| `marketplaceOpened` | `FE_MARKETPLACE_OPENED` | Marketplace screen becomes focused. Count each user-visible open/focus. | `marketplace_opened_count`. |
| `offerSearchPerformed` | `FE_OFFER_SEARCH_PERFORMED` | User intentionally applies marketplace search/filter criteria. Do not emit per keystroke or render. | `offer_search_count`. |
| `noOffersFound` | `FE_NO_OFFERS_FOUND` | Marketplace search/filter or initial all-offers load finishes with zero visible offers. Emit once per result context. | `no_offers_found_count`. |
| `offerViewed` | `FE_OFFER_VIEWED` | User opens a non-owned offer detail from marketplace or another offer inspection entry point. | `offer_viewed_count`. |
| `offerCreateStarted` | `FE_OFFER_CREATE_STARTED` | User starts the new-offer flow, excluding edit flows for existing offers. | `offer_create_started_count`, offer creation funnel. |
| `offerPaused` | `FE_OFFER_PAUSED` | Existing offer successfully transitions from active to inactive. | Active offer lifecycle checks. |
| `offerResumed` | `FE_OFFER_RESUMED` | Existing offer successfully transitions from inactive to active. | Active offer lifecycle checks. |
| `offerDeleted` | `FE_OFFER_DELETED` | Existing offer is successfully deleted. | Active offer lifecycle checks. |
| `chatCreated` | `FE_CHAT_CREATED` | A two-sided chat is created. To avoid double counting, emit on the accepting side only, after the owner successfully accepts an incoming request. | `chat_created_count`, North Star `two_sided_chats_count`. |
| `chatOpened` | `FE_CHAT_OPENED` | Chat detail becomes focused because the user opened a chat. | `chat_openers_count`, chat opener active/churn cohorts. |

## Aggregation Mapping

The business list contains a mix of events and aggregations. Use the FE events
above as sources for these metrics.

| Business metric | Source |
| --- | --- |
| `app_opened_count` | Count `appOpened`. |
| session starts | Count `sessionStarted`; this is intentionally throttled to max once per 10 minutes per `analyticsId`. |
| `registration_completed_count` | Count `loginFinished`. |
| `registered_count` | Distinct `analyticsId` with `loginFinished`. |
| `marketplace_opened_count` | Count `marketplaceOpened`. |
| `offer_search_count` | Count `offerSearchPerformed`. |
| `no_offers_found_count` | Count `noOffersFound`. |
| `offer_viewed_count` | Count `offerViewed`. |
| `offer_create_started_count` | Count `offerCreateStarted`. |
| `offer_created_count` | Count `offerCreated`. |
| `offer_creators_count` | Distinct `analyticsId` with `offerCreated`. |
| `chat_created_count` | Count `chatCreated`. |
| `chat_openers_count` | Distinct `analyticsId` with `chatOpened`. |
| `active_offers_count` | Prefer an authoritative backend/offer-service snapshot. FE transition events (`offerCreated`, `offerPaused`, `offerResumed`, `offerDeleted`) are useful for funnels and sanity checks, but they are not a reliable source of truth for current active offers because expiration and cross-device/server state can change without a FE event. |

## North Star Metric

North Star: `two_sided_chats_count` per city per day, or per country per day.

Use `chatCreated` as the canonical event count. Emit it only once per accepted
request, from the accepting/offer-owner side.

The implemented frontend events do not provide city or country, and they do not
include offer/chat identifiers. To segment `chatCreated` by city or country,
choose one of these before implementation:

- Backend enrichment: derive the accepted offer's city/country in the backend or
  BI layer from offer/chat data.
- Payload extension: extend `ReportFrontendEventRequest` with coarse,
  non-identifying event attributes and send a city/country dimension only where
  privacy requirements allow it.

Do not try to encode city, country, offer id, or any other dimensions into the
event name.

## Churn And Active Cohorts

Use `sessionStarted` as the preferred generic activity event for
retention/churn. Use `appOpened` only when analytics needs raw foreground-open
frequency instead of sessionized activity.

| Business cohort metric | Source |
| --- | --- |
| `registered_active_d1_count` | Users with `loginFinished` and `sessionStarted` in the D1 activity window. |
| `registered_active_d7_count` | Users with `loginFinished` and `sessionStarted` in the D7 activity window. |
| `registered_active_d30_count` | Users with `loginFinished` and `sessionStarted` in the D30 activity window. |
| `registered_churned_d30_count` | Users with `loginFinished` and no `sessionStarted` in the D30 churn window. |
| `offer_creators_active_d30_count` | Users with `offerCreated` and `sessionStarted` in the D30 activity window. |
| `offer_creators_churned_d30_count` | Users with `offerCreated` and no `sessionStarted` in the D30 churn window. |
| `chat_openers_active_d30_count` | Users with `chatOpened` and `sessionStarted` in the D30 activity window. |
| `chat_openers_churned_d30_count` | Users with `chatOpened` and no `sessionStarted` in the D30 churn window. |

The exact D1/D7/D30 window definition belongs in the analytics/BI layer. The FE
only needs to report the source events consistently.

## Grafana SQL

These queries target the PostgreSQL `metrics` table populated by the metrics
service.

Relevant columns:

- `name`: stored metric name, for example `FE_SESSION_STARTED`.
- `timestamp`: randomized frontend event time.
- `value`: increment value, currently `1` for FE events.
- `analytics_uuid`: anonymous analytics ID used to group events from the same
  login/device context.
- `attributes`: JSON object with app headers such as `client_platform`,
  `client_version`, `client_semver`, `app_source`, `language`, and `is_developer`.

Most business dashboards should filter out developer builds:

```sql
COALESCE(attributes ->> 'is_developer', 'false') = 'false'
```

### Event Counts Overview

Daily counts for the core business events. Use this for a multi-series time
series panel.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  CASE name
    WHEN 'FE_APP_OPENED' THEN 'app_opened_count'
    WHEN 'FE_SESSION_STARTED' THEN 'session_started_count'
    WHEN 'FE_LOGIN_FINISHED' THEN 'registration_completed_count'
    WHEN 'FE_MARKETPLACE_OPENED' THEN 'marketplace_opened_count'
    WHEN 'FE_OFFER_SEARCH_PERFORMED' THEN 'offer_search_count'
    WHEN 'FE_NO_OFFERS_FOUND' THEN 'no_offers_found_count'
    WHEN 'FE_OFFER_VIEWED' THEN 'offer_viewed_count'
    WHEN 'FE_OFFER_CREATE_STARTED' THEN 'offer_create_started_count'
    WHEN 'FE_OFFER_CREATED' THEN 'offer_created_count'
    WHEN 'FE_CHAT_CREATED' THEN 'chat_created_count'
    WHEN 'FE_CHAT_OPENED' THEN 'chat_opened_count'
  END AS metric,
  SUM(value)::bigint AS value
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name IN (
    'FE_APP_OPENED',
    'FE_SESSION_STARTED',
    'FE_LOGIN_FINISHED',
    'FE_MARKETPLACE_OPENED',
    'FE_OFFER_SEARCH_PERFORMED',
    'FE_NO_OFFERS_FOUND',
    'FE_OFFER_VIEWED',
    'FE_OFFER_CREATE_STARTED',
    'FE_OFFER_CREATED',
    'FE_CHAT_CREATED',
    'FE_CHAT_OPENED'
  )
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Daily Active Users

Session-based DAU. Prefer this over raw `appOpened` for active user charts.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  COUNT(DISTINCT analytics_uuid)::bigint AS daily_active_users
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name = 'FE_SESSION_STARTED'
  AND analytics_uuid IS NOT NULL
GROUP BY 1
ORDER BY 1;
```

### WAU And MAU

Rolling 7-day and 30-day active users. This is more expensive than plain daily
counts, so use it for a dedicated active users panel.

```sql
WITH days AS (
  SELECT generate_series(
    date_trunc('day', $__timeFrom()::timestamp),
    date_trunc('day', $__timeTo()::timestamp),
    interval '1 day'
  ) AS day
)
SELECT
  days.day AS time,
  COUNT(DISTINCT m.analytics_uuid) FILTER (
    WHERE m."timestamp" >= days.day - interval '6 days'
      AND m."timestamp" < days.day + interval '1 day'
  )::bigint AS wau,
  COUNT(DISTINCT m.analytics_uuid) FILTER (
    WHERE m."timestamp" >= days.day - interval '29 days'
      AND m."timestamp" < days.day + interval '1 day'
  )::bigint AS mau
FROM days
LEFT JOIN metrics m
  ON m.name = 'FE_SESSION_STARTED'
  AND m.analytics_uuid IS NOT NULL
  AND COALESCE(m.attributes ->> 'is_developer', 'false') = 'false'
  AND m."timestamp" >= days.day - interval '29 days'
  AND m."timestamp" < days.day + interval '1 day'
GROUP BY days.day
ORDER BY days.day;
```

### Registration And Retention

Daily registration cohorts with D1, D7, and D30 activity. Cohorts that are not
old enough for a window return `NULL` for that window.

```sql
WITH registrations AS (
  SELECT
    analytics_uuid,
    MIN("timestamp") AS registered_at
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_LOGIN_FINISHED'
    AND analytics_uuid IS NOT NULL
  GROUP BY analytics_uuid
),
activity AS (
  SELECT DISTINCT
    analytics_uuid,
    "timestamp"
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_SESSION_STARTED'
    AND analytics_uuid IS NOT NULL
)
SELECT
  date_trunc('day', r.registered_at) AS time,
  COUNT(*)::bigint AS registered_count,
  CASE
    WHEN date_trunc('day', r.registered_at) <= now() - interval '1 day'
    THEN COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = r.analytics_uuid
          AND a."timestamp" >= r.registered_at + interval '1 day'
          AND a."timestamp" < r.registered_at + interval '2 days'
      )
    )::bigint
  END AS registered_active_d1_count,
  CASE
    WHEN date_trunc('day', r.registered_at) <= now() - interval '7 days'
    THEN COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = r.analytics_uuid
          AND a."timestamp" >= r.registered_at + interval '7 days'
          AND a."timestamp" < r.registered_at + interval '8 days'
      )
    )::bigint
  END AS registered_active_d7_count,
  CASE
    WHEN date_trunc('day', r.registered_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = r.analytics_uuid
          AND a."timestamp" >= r.registered_at + interval '30 days'
          AND a."timestamp" < r.registered_at + interval '31 days'
      )
    )::bigint
  END AS registered_active_d30_count,
  CASE
    WHEN date_trunc('day', r.registered_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = r.analytics_uuid
          AND a."timestamp" >= r.registered_at
          AND a."timestamp" < r.registered_at + interval '30 days'
      )
    )::bigint
  END AS registered_churned_d30_count
FROM registrations r
WHERE $__timeFilter(r.registered_at)
GROUP BY 1
ORDER BY 1;
```

### Offer Creator Retention

D30 activity and churn for users who created at least one offer.

```sql
WITH creators AS (
  SELECT
    analytics_uuid,
    MIN("timestamp") AS first_offer_created_at
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_OFFER_CREATED'
    AND analytics_uuid IS NOT NULL
  GROUP BY analytics_uuid
),
activity AS (
  SELECT DISTINCT
    analytics_uuid,
    "timestamp"
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_SESSION_STARTED'
    AND analytics_uuid IS NOT NULL
)
SELECT
  date_trunc('day', c.first_offer_created_at) AS time,
  COUNT(*)::bigint AS offer_creators_count,
  CASE
    WHEN date_trunc('day', c.first_offer_created_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = c.analytics_uuid
          AND a."timestamp" >= c.first_offer_created_at + interval '30 days'
          AND a."timestamp" < c.first_offer_created_at + interval '31 days'
      )
    )::bigint
  END AS offer_creators_active_d30_count,
  CASE
    WHEN date_trunc('day', c.first_offer_created_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = c.analytics_uuid
          AND a."timestamp" >= c.first_offer_created_at
          AND a."timestamp" < c.first_offer_created_at + interval '30 days'
      )
    )::bigint
  END AS offer_creators_churned_d30_count
FROM creators c
WHERE $__timeFilter(c.first_offer_created_at)
GROUP BY 1
ORDER BY 1;
```

### Chat Opener Retention

D30 activity and churn for users who opened at least one chat.

```sql
WITH chat_openers AS (
  SELECT
    analytics_uuid,
    MIN("timestamp") AS first_chat_opened_at
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_CHAT_OPENED'
    AND analytics_uuid IS NOT NULL
  GROUP BY analytics_uuid
),
activity AS (
  SELECT DISTINCT
    analytics_uuid,
    "timestamp"
  FROM metrics
  WHERE
    COALESCE(attributes ->> 'is_developer', 'false') = 'false'
    AND name = 'FE_SESSION_STARTED'
    AND analytics_uuid IS NOT NULL
)
SELECT
  date_trunc('day', c.first_chat_opened_at) AS time,
  COUNT(*)::bigint AS chat_openers_count,
  CASE
    WHEN date_trunc('day', c.first_chat_opened_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = c.analytics_uuid
          AND a."timestamp" >= c.first_chat_opened_at + interval '30 days'
          AND a."timestamp" < c.first_chat_opened_at + interval '31 days'
      )
    )::bigint
  END AS chat_openers_active_d30_count,
  CASE
    WHEN date_trunc('day', c.first_chat_opened_at) <= now() - interval '30 days'
    THEN COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1
        FROM activity a
        WHERE a.analytics_uuid = c.analytics_uuid
          AND a."timestamp" >= c.first_chat_opened_at
          AND a."timestamp" < c.first_chat_opened_at + interval '30 days'
      )
    )::bigint
  END AS chat_openers_churned_d30_count
FROM chat_openers c
WHERE $__timeFilter(c.first_chat_opened_at)
GROUP BY 1
ORDER BY 1;
```

### Marketplace Funnel

Daily marketplace activity with basic conversion ratios.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  SUM(value) FILTER (WHERE name = 'FE_MARKETPLACE_OPENED')::bigint AS marketplace_opened_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_SEARCH_PERFORMED')::bigint AS offer_search_count,
  SUM(value) FILTER (WHERE name = 'FE_NO_OFFERS_FOUND')::bigint AS no_offers_found_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_VIEWED')::bigint AS offer_viewed_count,
  ROUND(
    100.0 * SUM(value) FILTER (WHERE name = 'FE_OFFER_VIEWED')
      / NULLIF(SUM(value) FILTER (WHERE name = 'FE_MARKETPLACE_OPENED'), 0),
    2
  ) AS marketplace_to_offer_view_percent
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name IN (
    'FE_MARKETPLACE_OPENED',
    'FE_OFFER_SEARCH_PERFORMED',
    'FE_NO_OFFERS_FOUND',
    'FE_OFFER_VIEWED'
  )
GROUP BY 1
ORDER BY 1;
```

### Offer Creation Funnel

Daily offer creation start/completion conversion.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_CREATE_STARTED')::bigint AS offer_create_started_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_CREATED')::bigint AS offer_created_count,
  ROUND(
    100.0 * SUM(value) FILTER (WHERE name = 'FE_OFFER_CREATED')
      / NULLIF(SUM(value) FILTER (WHERE name = 'FE_OFFER_CREATE_STARTED'), 0),
    2
  ) AS offer_create_completion_percent
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name IN ('FE_OFFER_CREATE_STARTED', 'FE_OFFER_CREATED')
GROUP BY 1
ORDER BY 1;
```

### Chat Funnel

Daily request-to-chat funnel. Use `chatCreated` as the canonical two-sided chat
count.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_REQUESTED')::bigint AS offer_requested_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_REREQUESTED')::bigint AS offer_rerequested_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_REQUEST_ACCEPTED')::bigint AS offer_request_accepted_count,
  SUM(value) FILTER (WHERE name = 'FE_OFFER_REQUEST_DENIED')::bigint AS offer_request_denied_count,
  SUM(value) FILTER (WHERE name = 'FE_CHAT_CREATED')::bigint AS chat_created_count,
  SUM(value) FILTER (WHERE name = 'FE_CHAT_OPENED')::bigint AS chat_opened_count,
  SUM(value) FILTER (WHERE name = 'FE_CHAT_CLOSED')::bigint AS chat_closed_count,
  ROUND(
    100.0 * SUM(value) FILTER (WHERE name = 'FE_CHAT_CREATED')
      / NULLIF(SUM(value) FILTER (WHERE name IN ('FE_OFFER_REQUESTED', 'FE_OFFER_REREQUESTED')), 0),
    2
  ) AS request_to_chat_created_percent
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name IN (
    'FE_OFFER_REQUESTED',
    'FE_OFFER_REREQUESTED',
    'FE_OFFER_REQUEST_ACCEPTED',
    'FE_OFFER_REQUEST_DENIED',
    'FE_CHAT_CREATED',
    'FE_CHAT_OPENED',
    'FE_CHAT_CLOSED'
  )
GROUP BY 1
ORDER BY 1;
```

### North Star

Global `two_sided_chats_count` per day. City/country segmentation is not
available from the current FE event payload; it requires backend enrichment or a
new coarse, privacy-reviewed event attribute.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  SUM(value)::bigint AS two_sided_chats_count
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name = 'FE_CHAT_CREATED'
GROUP BY 1
ORDER BY 1;
```

### Platform And Version Breakdown

Use this as a table or stacked bar panel to spot integration/client issues.

```sql
SELECT
  COALESCE(attributes ->> 'client_platform', 'UNKNOWN') AS platform,
  COALESCE(attributes ->> 'client_semver', 'UNKNOWN') AS app_version,
  COALESCE(attributes ->> 'app_source', 'UNKNOWN') AS app_source,
  name AS event,
  SUM(value)::bigint AS events_count,
  COUNT(DISTINCT analytics_uuid)::bigint AS unique_analytics_ids
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name LIKE 'FE_%'
GROUP BY 1, 2, 3, 4
ORDER BY events_count DESC;
```

### Language Breakdown

Use this for a table or pie chart showing language distribution among active
sessions.

```sql
SELECT
  COALESCE(attributes ->> 'language', 'UNKNOWN') AS language,
  COUNT(DISTINCT analytics_uuid)::bigint AS active_users,
  SUM(value)::bigint AS sessions
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name = 'FE_SESSION_STARTED'
  AND analytics_uuid IS NOT NULL
GROUP BY 1
ORDER BY active_users DESC;
```

### Active Offers Approximation

This is only a FE lifecycle approximation. Prefer an authoritative offer-service
snapshot for `active_offers_count`.

```sql
SELECT
  $__timeGroup("timestamp", '1d') AS time,
  COALESCE(SUM(value) FILTER (WHERE name IN ('FE_OFFER_CREATED', 'FE_OFFER_RESUMED')), 0)::bigint
    - COALESCE(SUM(value) FILTER (WHERE name IN ('FE_OFFER_PAUSED', 'FE_OFFER_DELETED')), 0)::bigint
    AS active_offers_delta
FROM metrics
WHERE
  $__timeFilter("timestamp")
  AND COALESCE(attributes ->> 'is_developer', 'false') = 'false'
  AND name IN (
    'FE_OFFER_CREATED',
    'FE_OFFER_RESUMED',
    'FE_OFFER_PAUSED',
    'FE_OFFER_DELETED'
  )
GROUP BY 1
ORDER BY 1;
```

## Implementation Notes

When adding new events:

- Add the literal to `FrontendEvent`.
- Add the metric-name mapping in `frontendEventToMetricName`.
- Report through `reportFrontendEventActionAtom`.
- Keep events idempotent at the UI action level where repeated renders or
  background refreshes could otherwise duplicate counts.
