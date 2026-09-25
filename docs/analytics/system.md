# Frontend analytics system design

Design for the privacy-aware client analytics described in `README.md`. The per-metric analysis in `metrics/` says _what_ to collect; this document says _how_. The team implements from this document; the metric files are the backlog of definitions to add.

## 1. Goals and constraints

Goal: answer the business questions in `metrics/` (funnels, cohorts, weekly activity, churn readouts) without the server ever holding a record that describes an identifiable user or device.

Hard constraints (not negotiable, every work item below must respect them):

1. **No exact event timestamps leave the device.** Only calendar buckets: day (`YYYY-MM-DD`), ISO week (`YYYY-Www`) or month (`YYYY-MM`). Durations are bucketed on the client before upload.
2. **No per-user or per-device id on the server.** Every id is scoped to one journey instance or one calendar bucket, is random, and expires with it. Two rows from the same device never share an id or any attribute that could link them beyond platform and release line.
3. **Users can opt out** in settings. Opt-out is the only sampling mechanism; there is no server-side or client-side sampling on top of it.

Secondary goals: one server primitive, one shared definitions package, and a client that keeps working offline and before login.

Not covered here (see section 11): acquisition source, completed trades, feedback ratings, D90 retention, A/B variants.

## 2. Concepts

| Concept                | Meaning                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Journey**            | One instance of a predefined flow on one device (one onboarding, one offer-creation, one "registration cohort" window). The client owns a random `journeyId`, keeps the whole state locally, and every upload _replaces_ the state under that id. The server keeps only the latest state. The last state of a journey that never reached a terminal step is the churn signal. |
| **Journey lifetime**   | Declared per definition (typical 7 or 30 days, counted from `startDay`). After the terminal step or the lifetime, the client deletes the id. The server nulls the id after lifetime plus grace so the row can never be updated or linked again.                                                                                                                               |
| **Aggregation**        | Per absolute calendar bucket the client keeps capped counters and small enums, and upserts them under a random per-bucket id. One row per reporting instance per bucket. Once the bucket is closed and the final flush acknowledged, the client drops the id.                                                                                                                 |
| **Bucket**             | Calendar-aligned, UTC based: day, ISO week (Monday start) or month. Buckets are absolute, never relative to install or registration.                                                                                                                                                                                                                                          |
| **Settle period**      | Time after a bucket closes during which late flushes can still arrive (14 days, tunable). Dashboards show a bucket as final only after it.                                                                                                                                                                                                                                    |
| **Reporting instance** | One app install with analytics enabled that uploaded at least one row for the population in question. All dashboard populations are counted in reporting instances, never in users.                                                                                                                                                                                           |
| **Core action**        | Successful offer creation or successful messaging request. Re-requests and note-origin requests are excluded.                                                                                                                                                                                                                                                                 |
| **Creation class**     | `main` when no clubs were selected for the offer, `both` when at least one club was selected. There is no club-only class because the offer form always has a contact connection level.                                                                                                                                                                                       |
| **Request class**      | `club` when the offer reached the device only through a club, `main` otherwise. No UI surface tracking: the class comes from the offer's origin, not from which screen was open.                                                                                                                                                                                              |

Long-lived journeys (lifetime over 7 days) carry booleans and enums only in the payload; country, platform and release line are row columns, never payload fields. They never carry free numbers. Short journeys and aggregations may carry capped counters and duration buckets.

## 3. Data flow

```
 mobile app                          metrics-service                    dashboard
 ----------                          ---------------                    ---------
 signal site (e.g. createOffer ok)
   | record step / bump counter
   v
 outbox in MMKV (immediate save)
   | flush: app start (reliable),
   | app background (best effort)
   v
 PUT /analytics/state  {id, kind, name, ...}  --->  validate name + schema
   (unauthenticated, rate limited,               |  extract platform, release line
    common headers only)                         v
                                          analytics_states (upsert by id)
   <---  204 / 4xx / 5xx  ------------------    |
   | 204: mark acknowledged, drop id if closed   | daily job: null expired ids,
   | 4xx: drop from outbox                       |            delete old rows
   | 5xx / offline: keep, retry next flush       v
                                          read-only queries  ------------------>  charts with
                                                                                   suppression + maturity
```

Delayed uploads: the _initial_ upload of any journey and _every_ club-related upload are queued for the next app start, not sent in the same session as the triggering action. This prevents joining them by timing with backend rows such as `USER_LOGGED_IN`, `OFFER_CREATED` or `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`.

## 4. Server

### "Active offers" Endpoint contract

One endpoint on metrics-service, defined in `packages/rest-api/src/services/metrics/specification.ts` next to `reportNotificationInteraction`, which is the existing precedent for an unauthenticated metrics endpoint.

- Method and path: `PUT /analytics/state` (`HttpApiEndpoint.put`, name `upsertAnalyticsState`).
- Headers: `CommonHeaders` only. No security headers, no session. Must remain callable before login.
- Middleware: `RateLimitingMiddleware` (per IP, 24 h window, `MaxExpectedDailyCall` placeholder 300, tunable).
- Body size: hard cap 4 KB on the raw body (rejected with 413 before parsing), payload cap enforced again by the schema (max 64 keys, strings max 32 chars, integers max 1 000).
- Success: `NoContentResponse` (204). The client only needs the acknowledgement.

Request body:

| Field           | Type                         | Rules                                                                                                                                                                                                                 |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `Uuid`                       | Client-generated random v4, one per journey instance or per aggregation bucket.                                                                                                                                       |
| `kind`          | `'journey' \| 'aggregation'` | Must match the definition registered under `name`.                                                                                                                                                                    |
| `name`          | string                       | Must be in the definitions allow-list. Unknown name: 400.                                                                                                                                                             |
| `schemaVersion` | integer                      | Must equal the version the server knows for `name`. Older versions: 400 (client drops the row).                                                                                                                       |
| `revision`      | integer, 0 or more           | Per-id counter incremented by the client on every state change. Server ignores an upsert whose revision is lower than the stored one (retries arriving out of order). Not a timestamp.                                |
| `startDay`      | `YYYY-MM-DD`                 | Journey: day the journey instance started. Aggregation: first day of the bucket.                                                                                                                                      |
| `updatedDay`    | `YYYY-MM-DD`                 | Day of the last local state change. Must be `>= startDay` and not more than one day in the future (clock skew). Long-lived journeys round it to the ISO week start (definition option `updatedDayPrecision: 'week'`). |
| `payload`       | object                       | Validated with the definition's effect Schema, `onExcessProperty: 'error'`. Extra or unknown fields: 400.                                                                                                             |

Errors: 400 invalid or stale (`startDay` older than lifetime plus grace, unknown name, schema mismatch, kind mismatch with an existing row), 413 too large, 429 rate limited, 500 unexpected. The client treats any 4xx as "drop this outbox entry" and 5xx or network failure as "retry at the next flush".

### "Offers created during one day one week or one month" Table `analytics_states`

New table in metrics-service (migration `0004_add_analytics_states_table.ts`, registered in `apps/metrics-service/src/db/layer.ts`). The existing `metrics` table is not used: it has an exact `timestamp` column and the notification `trackingId` convention, both incompatible with this design.

| Column              | Type            | Notes                                                                                                                                                                                                                                                                   |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pk`                | bigint identity | Primary key. Row order is a weak write-order side channel, accepted (see section 8).                                                                                                                                                                                    |
| `id`                | uuid, nullable  | Client id. Partial unique index `WHERE id IS NOT NULL`. Set to null by the expiry job; a nulled row can never be matched again.                                                                                                                                         |
| `kind`              | varchar         | `journey` or `aggregation`.                                                                                                                                                                                                                                             |
| `name`              | varchar         | Definition name.                                                                                                                                                                                                                                                        |
| `schema_version`    | integer         | Version of the payload schema at write time.                                                                                                                                                                                                                            |
| `revision`          | integer         | Last accepted client revision.                                                                                                                                                                                                                                          |
| `start_day`         | date            | See contract.                                                                                                                                                                                                                                                           |
| `updated_day`       | date            | See contract.                                                                                                                                                                                                                                                           |
| `payload`           | jsonb           | Validated state.                                                                                                                                                                                                                                                        |
| `app_platform`      | varchar         | `IOS` / `ANDROID` from `CommonHeaders.clientPlatformOrNone`, `unknown` fallback.                                                                                                                                                                                        |
| `app_major_version` | varchar         | Release line `YY.M` from `CommonHeaders.clientSemverOrNone` (CalVer: the first component alone is the year and carries no information). `unknown` fallback.                                                                                                             |
| `country_prefix`    | varchar         | Phone country prefix from `CommonHeaders.prefixOrNone`, `none` fallback. Definitions with `storeCountry: false` (all club definitions) are stored as `none`. Decision: country is stored on journeys and aggregations alike, and the dashboard suppresses small groups. |

No `created_at`, no `updated_at`, no IP, no version code, no app source, no language, no device model, no OS version. `vexl-app-meta` carries all of those on every request; the handler reads exactly three getters (platform, semver, prefix) and drops the rest.

Indexes: `(name, start_day)` for dashboard reads; partial unique on `id`.

Upsert semantics: `INSERT ... ON CONFLICT (id) DO UPDATE SET payload, revision, updated_day, schema_version, app_platform, app_major_version, country_prefix WHERE excluded.revision >= analytics_states.revision AND analytics_states.kind = excluded.kind AND analytics_states.name = excluded.name`. A conflicting `kind` or `name` is a 400, not an update.

### "Offers viewed or opened" Validation

- The server imports the definition registry from the definitions package (section 5). Validation is `Schema.decodeUnknown(definition.payloadSchema)` with excess properties rejected.
- Rejected rows are not stored anywhere (no equivalent of `dead_metrics`): a rejected payload is exactly the kind of data we do not want on disk. Log a warning with `name` and the error tag only, never the payload.
- Staleness: reject when `today - startDay > lifetimeDays + graceDays` (journeys) or `today - bucketEndDay > settleDays` (aggregations). This closes the window in which a nulled id could be re-created as a new row.

### "Offers by country" Expiry and retention job

One daily task via `makeRepeatingTaskLayer` (`packages/server-utils/src/repeatingTask.ts`, Redis locked, cron `15 3 * * *` UTC):

1. `UPDATE analytics_states SET id = NULL WHERE id IS NOT NULL AND kind = 'journey' AND start_day < today - (lifetimeDays + graceDays)` per definition (grace 7 days).
2. Same for aggregations with `start_day + periodDays + settleDays`.
3. `DELETE FROM analytics_states WHERE start_day < today - retentionDays` (retention 540 days, tunable). Dashboards that need longer history must materialize aggregates, not keep raw rows.

Retention policy in one line: a row keeps its id for at most lifetime plus grace, keeps its payload for at most `retentionDays`, and never gets a timestamp added.

### "Offers by city" Ingress requirement (infra, flag for the infrastructure repo)

The request itself reveals IP, exact time and the `vexl-app-meta` header (country prefix, version code). Cloudflare and the metrics-service `HttpMiddleware.logger` both see it. Requirements:

- Exclude `/analytics/state` from long-term edge access logging, or keep those logs at short retention (7 days or less).
- Do not log request headers for this path in the service (the default `HttpMiddleware.logger` logs method and path; keep it that way, never add header logging).
- Combined with delayed uploads and day-granular rows, this is what prevents a log-to-row join.

## 5. Definitions package

Working name `packages/analytics-definitions` (tentative). Platform-agnostic, depends only on `effect`. Consumers: `apps/mobile` (produce), `apps/metrics-service` (validate and store), `apps/dashboard-app` (read and label).

What lives there:

- `calendar.ts`: `dayOf(date)`, `isoWeekOf(date)`, `monthOf(date)`, `bucketStartDay(bucket)`, `bucketEndDay(bucket)`, `isBucketClosed(bucket, today)`. All UTC.
- `buckets.ts`: `DurationBucket` (`lt1m`, `1mTo10m`, `10mTo1h`, `1hTo1d`, `gt1d`), `DaysBucket` (`d0`, `d1`, `d2To7`, `d8To30`, `gt30`), `CountBucket` (`0`, `1`, `2To5`, `6To10`, `gt10`) and the pure functions that produce them.
- `counters.ts`: `cappedCounter(max)` schema (integer 0 to max) and `increment(state, key)` that saturates at the cap.
- `journey.ts`: `defineJourney({name, schemaVersion, lifetimeDays, updatedDayPrecision, state, terminalStates, reduce})`. `reduce(state, step) => state` is the pure replace reducer; the client stores its output and uploads it whole.
- `aggregation.ts`: `defineAggregation({name, schemaVersion, period, counters, fields})` producing the payload schema and an `empty()` state.
- `registry.ts`: `definitions: Record<name, JourneyDefinition | AggregationDefinition>` and `payloadSchemaFor(name)`. This record is the server allow-list.
- `coreAction.ts`: `creationClass(intendedClubs)` and `requestClass(offerOrigin)` so the rule in section 2 has one implementation.

Example journeys (from `metrics/acquisition.md`). Onboarding is a short journey and ends when the post-login flow finishes; activation and retention live on the separate `registrationCohort` journey that starts at registration:

```ts
const OnboardingStep = Schema.Literal(
  "opened",
  "intro",
  "phoneSubmitted",
  "codeVerified",
  "registered",
  "contactsImport",
  "notifications",
  "onboardingFinished",
);

export const onboardingJourney = defineJourney({
  name: "onboarding",
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: "day",
  state: Schema.Struct({
    step: OnboardingStep,
    reLogin: Schema.Boolean,
    contactsImport: Schema.optional(
      Schema.Literal("success", "zero", "skipped", "denied", "error"),
    ),
    notifications: Schema.optional(Schema.Literal("granted", "skipped")),
    openToRegistration: Schema.optional(DurationBucket),
  }),
  terminalStates: ["onboardingFinished"],
  reduce: (state, step) => ({ ...state, ...step }),
});

export const registrationCohortJourney = defineJourney({
  name: "registrationCohort",
  schemaVersion: 1,
  lifetimeDays: 31,
  updatedDayPrecision: "week",
  state: Schema.Struct({
    activatedBy: Schema.optional(Schema.Literal("offer", "request")),
    activationClass: Schema.optional(Schema.Literal("main", "both", "club")),
    registrationToActivation: Schema.optional(DaysBucket),
    d1: Schema.Boolean,
    d7: Schema.Boolean,
    d30: Schema.Boolean,
  }),
  terminalStates: [],
  reduce: (state, step) => ({ ...state, ...step }),
});
```

Example aggregation (weekly activity, from `metrics/active-users.md` and `metrics/sessions.md`):

```ts
export const weeklyActivity = defineAggregation({
  name: "weeklyActivity",
  schemaVersion: 1,
  period: "week",
  counters: {
    offersCreatedMain: cappedCounter(20),
    offersCreatedBoth: cappedCounter(20),
    requestsSentMain: cappedCounter(20),
    requestsSentClub: cappedCounter(20),
    marketplaceOpened: cappedCounter(50),
    sessions: cappedCounter(50),
  },
  fields: {
    coreActive: Schema.Boolean,
    firstLoadResult: Schema.Literal("offers", "empty", "notLoaded"),
  },
});
```

Schema changes bump `schemaVersion`. The server accepts exactly one version per name; the mobile release that ships a new version must ship before the server drops the old one, so keep a two-version window on the server during rollouts (the registry can hold `previousVersions` for that).

## 6. Client SDK (apps/mobile)

### "Club joins" Building blocks that exist

- `atomWithParsedMmkvStorageWithImmediateSaveOption(key, default, schema)` in `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` returns `{atom, setAndSaveImmediatelyAtom}`. The plain `atomWithParsedMmkvStorage` defers writes behind an idle callback; the OS can kill the process first, so the outbox and markers use the immediate-save variant (or `flushNow` on the returned `FlushablePrimitiveAtom`).
- `useAppState` (`apps/mobile/src/utils/useAppState.ts`), already wired in `App.tsx` as `useAppState(setLastTimeAppWasRunningToNow)`. The background flush hooks in beside it.
- `useInAppLoadingTasks` with `requirements: {runOn: 'start', requiresUserLoggedIn: false}` for the start flush.
- `preferencesAtom` (`apps/mobile/src/utils/preferences/index.ts`) for the opt-out toggle.
- `clearMmkvStorageAndEmptyAtoms` wipes all MMKV on logout; `detectMmkvDataLoss.ts` shows that silent wipes happen in the wild.
- `getLastTimeAppWasRunning` seeds "new session vs resumed session" for the session tracker.

### "Club activity" Local state

All in MMKV, immediate save, all deleted on logout with everything else:

| Key                     | Content                                                                                                          | Leaves device?                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `analyticsMarkers`      | `firstOpenAt`, `registeredAt`, `activatedAt`, `firstClubJoinedAt`, `lastCoreActionAt` (exact `UnixMilliseconds`) | Never. Only buckets derived from them are uploaded. |
| `analyticsJourneys`     | `Record<name, {id, revision, startDay, state, closed}>`                                                          | State only, via the outbox.                         |
| `analyticsAggregations` | `Record<name, Record<bucket, {id, revision, state, acknowledgedRevision}>>`                                      | State only, via the outbox.                         |
| `analyticsOutbox`       | Ordered list of `{id, kind, name, revision, notBefore: 'now' \| 'nextStart'}`                                    | The upload queue.                                   |
| `analyticsSession`      | Session tracker checkpoint (open session start, accumulated foreground seconds, short ring of session starts)    | Never raw.                                          |

A journey or aggregation is stored once; the outbox holds references, so a burst of steps before a flush uploads the latest state only.

### "Club offers created" API

One module `apps/mobile/src/utils/analytics/` exposing:

- `recordJourneyStep(definition, step)`: reads the journey, runs `reduce`, bumps `revision`, saves immediately, enqueues. First step of a new instance generates the id, sets `startDay`, and enqueues with `notBefore: 'nextStart'`. Club journeys always enqueue with `nextStart`. Steps after the lifetime are ignored and the local record deleted.
- `bumpCounter(definition, key)` and `setField(definition, key, value)`: resolve the current bucket, create the per-bucket state on first touch, saturate at the cap, enqueue.
- `closeBucket(...)`: on a bucket boundary, the previous bucket is enqueued one last time; after its acknowledgement the id is deleted locally.
- `flushAnalytics()`: drains the outbox in order, skipping `nextStart` entries during a background flush. 204: mark acknowledged (and delete closed ids). 4xx: drop. 5xx or offline: stop, keep the rest.

Signal sites (from `README.md`): `finishLoginActionAtom` (registered), `postLoginOnboarding.ts` and `ContactsImportScreen.tsx` (post-login steps), `createOfferActionAtom` and `sendRequestActionAtom` (core actions, classes from `coreAction.ts`), `submitCodeToJoinClubActionAtom` and `checkForClubsAdmissionActionAtom` (club join), `refreshOffersActionAtom` (first load result).

### "Club offers reacted to" Flush

- **App start**: an in-app loading task, `runOn: 'start'`, does not require login, runs `flushAnalytics()` including `nextStart` entries, with a random 0 to 60 s delay so start flushes do not line up with the refresh calls the app makes at the same moment.
- **Background**: `useAppState` on `background` (not iOS `inactive`) runs a best-effort flush of `now` entries with a short timeout. Losing it is fine; the next start catches up.
- No background task, no push-driven flush: those entry points return control to the OS unpredictably and the existing `flushAllScheduledMmkvWrites` note in `atomWithParsedMmkvStorage.ts` shows why.

### "Club chats opened" Pre-login reporting

The onboarding journey starts before a session exists. The rest-api client for the new endpoint must build the request with `makeCommonHeaders` only and must not call `getUserSessionCredentials` (which logs a warning and substitutes `dummySession` when logged out). Implement it as a separate function in `packages/rest-api/src/services/metrics/index.ts` that takes no `getUserSessionCredentials`.

### "Returning to a Club" Opt-out

- `preferencesAtom.analyticsEnabled`, default `true`, toggle in Settings (with a short explanation of what is and is not collected).
- Turning it off: clear the outbox, delete all journey and aggregation ids locally, stop recording. Rows already on the server keep their last state and expire normally; nothing can update them anymore.
- Turning it on again starts fresh instances. The opt-out state itself is never reported and there is no "opted out" row.

### "Club to contact import conversion" Failure modes

| Situation                                | Effect                                                                                                                                          | Dashboard handling                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Logout (`clearMmkvStorageAndEmptyAtoms`) | All local analytics state gone; open journeys stay at their last server state.                                                                  | Counted as `unknown` outcome once the cohort matures.                   |
| Reinstall or silent MMKV loss            | Same as logout; the next open is a new instance with new ids.                                                                                   | Same. Re-login is a new instance, never a continuation.                 |
| Process killed before flush              | Outbox is durable (immediate save); state uploads on next start.                                                                                | None.                                                                   |
| Offline for days                         | Outbox grows bounded by the number of open journeys plus buckets (one entry per id). Entries older than lifetime or settle are dropped locally. | Late aggregation flushes land inside the settle period or are rejected. |
| Server rejects (4xx)                     | Entry dropped, error reported with `name` and status only.                                                                                      | Missing row.                                                            |
| Clock skew on device                     | `updatedDay` may be off by a day; server tolerates one day forward.                                                                             | Day-level noise, acceptable.                                            |

Every cohort therefore has an explicit `unknown` bucket: journeys that reached the end of their lifetime without a terminal step. Churn read from last states is an upper bound that includes reinstalls, logouts, opt-outs and data loss.

## 7. Dashboard rules

- **Population label**: every chart states its population as "reporting instances" (with analytics enabled, on a release line that ships the definition), never "users". Backend counts (`NUMBER_OF_USERS`, `COUNT_OF_ACTIVE_USERS`) are shown separately and never used as a denominator for frontend rows.
- **Small-group suppression**: any group (cohort week, platform, release line, state value) with fewer than 20 reporting instances (placeholder, tunable) is hidden or merged into "other". Country is the dimension most likely to trip this; small countries roll up into a region or "other". Applied after filtering, so drilling down cannot reveal a suppressed group.
- **Maturity**: journey cohorts are shown only after `lifetimeDays + graceDays` since the cohort's last possible `startDay`; aggregation buckets only after `bucketEndDay + settleDays`. Immature buckets are drawn as provisional or not at all.
- **Outcome categories**: terminal states, `open` (still within lifetime), `unknown` (lifetime elapsed without terminal step). Never label `unknown` as churn.
- **Read path**: `apps/dashboard-app` today reads contact-service data for the public live dashboard; the analytics charts need a new read-only connection to the metrics database plus query helpers that import the definitions package for labels and cap values. Where a metric is `mixed`, the backend part comes from the existing `metrics` table.

## 8. Privacy analysis

Attacker model: full read access to `analytics_states` (dump, backup, or a compromised dashboard credential).

What they learn per row: platform, release line (`YY.M`), phone country prefix (`none` for club definitions), a definition name, a start day, an update day (week for long journeys), and a small enum or capped-counter state. For live rows, a random id with no meaning outside the device.

What they cannot learn:

- Who the instance is: no phone number, no hash, no IP, no device model, no installation id, no session token. Country prefix is the only demographic column.
- When exactly anything happened: day or week granularity only; the only sub-day information is the upload itself, which is not stored.
- Whether two rows belong to the same device: ids are independent random values per instance and per bucket, and the row attributes are limited to platform, release line and country prefix. For large countries that is a group of thousands; for small countries it is not, which is why suppression is mandatory on every read path.

Linkability across rows: two rows share nothing but `(app_platform, app_major_version, country_prefix, start_day)`. In a small population (a new release line on its first day, a small country) that tuple can be a group of one; the suppression rule in section 7 hides it on dashboards, but the raw table still holds it. Mitigation is population size, not schema; do not add dimensions.

Timing joins with backend rows: backend metrics (`USER_LOGGED_IN`, `OFFER_CREATED`, `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`) carry exact timestamps and country. A frontend row with the same day and a matching state would be joinable if it were written at the same time. Delayed initial uploads (next start), club uploads (next start), day granularity and the absence of write timestamps break that join. Residual side channels: Postgres `xmin`, `pk` order and backups taken at known times reveal approximate write order; access logs reveal upload time and IP. Both are why the ingress requirement in "Offers by city" and the delayed upload are mandatory, not optional.

Small groups: clubs are tiny, so club journeys carry no country, no version and `updatedDay` at week precision, and their uploads are always delayed. Long-lived journeys are the most linkable objects in the system because a random id lives for 30 days; they carry booleans and enums only, one journey per milestone, never chained.

Endpoint abuse: the endpoint is unauthenticated, so anyone can write junk. Schema validation, caps, the 4 KB body limit and per-IP rate limiting bound the damage to noise, and the dashboard's suppression and maturity rules bound the effect of a burst. Nothing in the payload can point at another user's data.

## 9. Work items

In dependency order. Each item ends with the verification steps from `AGENTS.md`.

**packages/analytics-definitions (tentative name)**

- [ ] Scaffold package (mirror `packages/generic-utils/package.json`, depend on `effect` only).
- [ ] `calendar.ts` bucket helpers with tests around year boundaries (ISO week 53, month rollover, UTC).
- [ ] `buckets.ts`, `counters.ts` with tests for caps and edges.
- [ ] `defineJourney`, `defineAggregation`, `registry.ts`, `payloadSchemaFor`.
- [ ] `coreAction.ts` with the creation and request class rules.
- [ ] First definitions: `onboarding` and `registrationCohort` journeys, `weeklyActivity` aggregation. Further definitions follow the metric files one category at a time.

**packages/rest-api**

- [ ] `UpsertAnalyticsStateRequest` body schema in `services/metrics/contracts.ts`.
- [ ] `PUT /analytics/state` endpoint in `services/metrics/specification.ts` with `CommonHeaders`, `MaxExpectedDailyCall`, 400 and 413 errors.
- [ ] Session-free client function in `services/metrics/index.ts`.

**apps/metrics-service**

- [ ] Migration `0004_add_analytics_states_table.ts`, registered in `db/layer.ts`.
- [ ] `MetricsDbService` queries: `upsertAnalyticsState`, `nullExpiredAnalyticsIds`, `deleteOldAnalyticsStates`.
- [ ] Route handler: body size guard, registry lookup, `Schema.decodeUnknown` with excess property error, staleness check, extraction of platform and release line only.
- [ ] Daily expiry and retention task via `makeRepeatingTaskLayer`.
- [ ] Config: `ANALYTICS_GRACE_DAYS`, `ANALYTICS_SETTLE_DAYS`, `ANALYTICS_RETENTION_DAYS`.
- [ ] Add a pointer to this document in `docs/backend_stats.md`.

**apps/mobile**

- [ ] `analyticsEnabled` in `preferencesAtom` and the Settings toggle (follow `docs/ui_coding_guideline.md`).
- [ ] Markers, journeys, aggregations, outbox atoms with `atomWithParsedMmkvStorageWithImmediateSaveOption`.
- [ ] `apps/mobile/src/utils/analytics/` module: `recordJourneyStep`, `bumpCounter`, `setField`, `closeBucket`, `flushAnalytics`.
- [ ] Start flush as an in-app loading task (`runOn: 'start'`, `requiresUserLoggedIn: false`); background flush via `useAppState` in `App.tsx`.
- [ ] Session tracker beside `useAppState(setLastTimeAppWasRunningToNow)` (from `metrics/sessions.md`).
- [ ] Hook signal sites listed in "Club offers created" for the first two definitions.
- [ ] Verify logout path leaves nothing behind (already covered by the full wipe; add a test).

**apps/dashboard-app**

- [ ] Read-only metrics database connection and query helpers.
- [ ] Suppression, maturity and population labelling as shared helpers used by every analytics chart.
- [ ] First charts: onboarding funnel by cohort week, weekly core-active instances.

**infrastructure (separate repo)**

- [ ] Access-log exclusion or short retention for `/analytics/state`.
- [ ] Rate limit values and body size cap in the environment.
- [ ] Database role for the dashboard read path.

## 10. Decisions made in this document

Recorded so they are not re-litigated in review:

- Journeys store both `startDay` and `updatedDay`; long journeys round `updatedDay` to week.
- `revision` (client counter per id) resolves retry ordering; there is no server-side timestamp.
- Buckets are UTC.
- `app_major_version` stores the CalVer release line `YY.M`.
- Rejected payloads are dropped, not dead-lettered.
- Opt-out defaults to enabled (it is an opt-out, not opt-in) and wipes local analytics state.
- Country prefix is stored on all rows (journeys and aggregations), except definitions marked `storeCountry: false` (clubs). Small-group suppression on the dashboard is the mitigation.
- Daily active users come from the backend refresh metric only. Client activity records are weekly and monthly engaged flags with no per-day bits.
- "Before churn" snapshots ("Marketplace actions before churn", "Chats opened before churn", "App sessions before churn") are rejected: a per-device record overwritten on every start is a standing device profile.
- Foreground session tracking (the sessions category of the metrics list) is deferred pending a business question.
- The first-release scope is decided later; the CSV priority column is not a reliable input.

## 11. Open questions

Only the genuinely open ones; each is tracked in `README.md` under "Open questions".

- **First-release scope**: which definitions ship first. Decided later, not by CSV priority.
- **Session tracking**: whether foreground session metrics are worth continuous local bookkeeping. Business question.
- **Acquisition source**: no source concept exists; blocked on a product decision (README: "Registrations by acquisition source" and dependents).
- **Completed trades and feedback ratings**: out of scope; feedback-service holds ratings with free text in the same row and needs its own aggregate read path (README).
- **D90 retention**: a 91-day journey id is beyond the accepted 30-day lifetime; not built unless explicitly approved (metrics/retention.md "D90 retention").
- **A/B variants**: no variant concept exists (README).
- **Dashboard reader**: whether `apps/dashboard-app` or a separate internal tool reads `analytics_states` affects only the read path work item, not the schema.
