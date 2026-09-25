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
   | flush: journey step (right away),
   | app start (reliable), app background (best effort)
   v
 PUT /analytics/state  {id, kind, name, ...}  --->  validate name + schema
   (unauthenticated, rate limited,               |  extract platform, release line
    common headers only)                         v
                                          analytics_states (upsert by id)
   <---  204 / 4xx / 5xx  ------------------    |
   | 204: mark acknowledged, drop id if closed   | daily job: null expired ids,
   | 4xx (not 429): drop from outbox             |            delete old rows
   | 5xx / offline: keep, retry next flush       v
                                          read-only queries  ------------------>  charts with
                                                                                   suppression + maturity
```

Upload timing: a journey step forks a flush right away (fire and forget; a failed request leaves the entry in the outbox for the next start or background flush). Aggregation updates only queue and go out with the next start or background flush. Flushes are serialized, so several steps recorded during one request go out as a single follow-up request with the latest state. The first upload of a journey therefore lands within seconds of the backend row of the same action (`USER_LOGGED_IN`, `OFFER_CREATED`, `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`); section 8 records why that is accepted.

## 4. Server

### 4.1 Endpoint contract

One endpoint on metrics-service, defined in `packages/rest-api/src/services/metrics/specification.ts` next to `reportNotificationInteraction`, which is the existing precedent for an unauthenticated metrics endpoint.

- Method and path: `PUT /analytics/state` (`HttpApiEndpoint.put`, name `upsertAnalyticsState`).
- Headers: `CommonHeaders` only. No security headers, no session. Must remain callable before login.
- Middleware: `RateLimitingMiddleware` (per IP, 24 h window, `MaxExpectedDailyCall` placeholder 300, tunable).
- Body size: hard cap 4 KB on the raw body. A request whose `content-length` exceeds it is answered with 413 before the body is read; a chunked body that grows past the cap is cut off by the platform's body-size limit. The payload cap is enforced again by the schema (max 64 keys, strings max 32 chars, integers max 1 000).
- Success: `NoContentResponse` (200 with an empty body, the same shape `reportNotificationInteraction` uses). The client only needs the acknowledgement.

Request body:

| Field           | Type                         | Rules                                                                                                                                                                                                                 |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `AnalyticsStateId`           | Client-generated random uuid v4, one per journey instance or per aggregation bucket. A string brand defined in the definitions package (it cannot depend on `domain`).                                                |
| `kind`          | `'journey' \| 'aggregation'` | Must match the definition registered under `name`.                                                                                                                                                                    |
| `name`          | string, at most 64 chars     | Must be in the definitions allow-list. Unknown name: 400.                                                                                                                                                             |
| `schemaVersion` | integer                      | Must equal the version the server knows for `name`. Older versions: 400 (client drops the row).                                                                                                                       |
| `revision`      | integer, 0 or more           | Per-id counter incremented by the client on every state change. Server ignores an upsert whose revision is lower than the stored one (retries arriving out of order). Not a timestamp.                                |
| `startDay`      | `YYYY-MM-DD`                 | Journey: day the journey instance started. Aggregation: first day of the bucket.                                                                                                                                      |
| `updatedDay`    | `YYYY-MM-DD`                 | Day of the last local state change. Must be `>= startDay` and not more than one day in the future (clock skew). Long-lived journeys round it to the ISO week start (definition option `updatedDayPrecision: 'week'`). |
| `payload`       | object                       | Validated with the definition's effect Schema, `onExcessProperty: 'error'`. Extra or unknown fields: 400.                                                                                                             |

Errors: 400 invalid or stale (`startDay` older than lifetime plus grace, unknown name, schema mismatch, kind mismatch with an existing row), 413 too large, 429 rate limited, 500 unexpected. The client treats any 4xx except 429 as "drop this outbox entry" and 429, 5xx or network failure as "retry at the next flush".

### 4.2 Table `analytics_states`

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

### 4.3 Validation

- The server imports the definition registry from the definitions package (section 5). Validation is `decodeAnalyticsPayload(name, schemaVersion, payload)`, which looks the name up, checks the schema version and runs `Schema.decodeUnknown(definition.payloadSchema, {onExcessProperty: 'error'})`. Any of its three failures (`UnknownAnalyticsDefinitionError`, `AnalyticsSchemaVersionMismatchError`, `ParseError`) maps to `InvalidAnalyticsStateError` (400).
- Rejected rows are not stored anywhere (no equivalent of `dead_metrics`): a rejected payload is exactly the kind of data we do not want on disk. Log a warning with `name` and the error tag only, never the payload.
- Staleness: reject when `today - startDay > lifetimeDays + graceDays` (journeys) or `today - bucketEndDay > settleDays` (aggregations). This closes the window in which a nulled id could be re-created as a new row. The rule is `analyticsStateMaxAgeDays` in the definitions package, shared with the expiry job and the dashboard maturity rule.

### 4.4 Expiry and retention job

One daily task via `makeRepeatingTaskLayer` (`packages/server-utils/src/repeatingTask.ts`, Redis locked, cron `15 3 * * *` UTC):

1. `UPDATE analytics_states SET id = NULL WHERE id IS NOT NULL AND kind = 'journey' AND start_day < today - (lifetimeDays + graceDays)` per definition (grace 7 days).
2. Same for aggregations, counted from the bucket end day: `start_day < today - (periodDays - 1 + settleDays)`, the same rule the handler uses for staleness (`periodDays` is 7 for week and 31 for month buckets).
3. `DELETE FROM analytics_states WHERE start_day < today - retentionDays` (retention 540 days, tunable). Dashboards that need longer history must materialize aggregates, not keep raw rows.

Retention policy in one line: a row keeps its id for at most lifetime plus grace, keeps its payload for at most `retentionDays`, and never gets a timestamp added.

### 4.5 Ingress requirement (infra, flag for the infrastructure repo)

The request itself reveals IP, exact time and the `vexl-app-meta` header (country prefix, version code). Cloudflare and the metrics-service `HttpMiddleware.logger` both see it. Requirements:

- Exclude `/analytics/state` from long-term edge access logging, or keep those logs at short retention (7 days or less).
- Do not log request headers for this path in the service (the default `HttpMiddleware.logger` logs method and path; keep it that way, never add header logging).
- Combined with day-granular rows and the absence of write timestamps, this is what keeps a log-to-row join from being trivial (section 8).

## 5. Definitions package

`packages/analytics-definitions` (`@vexl-next/analytics-definitions`). Platform-agnostic, depends only on `effect`. Consumers: `apps/mobile` (produce), `apps/metrics-service` (validate and store), `apps/backoffice-app` (read and label). Import style: `@vexl-next/analytics-definitions/src/<file>`.

What lives there:

- `core.ts`: `AnalyticsKind`, `DayString` (`YYYY-MM-DD` brand), `AnalyticsStateId` (uuid v4 brand), `AnalyticsStateUpsert` (the request body schema, `payload: Schema.Unknown`), `defineJourney({name, schemaVersion, lifetimeDays, updatedDayPrecision, storeCountry?, state, terminalStates})` and `defineAggregation({name, schemaVersion, period, storeCountry?, state})`. Both take the payload as one `Schema.Struct` (`state`) and return a plain definition object (`kind`, `name`, `schemaVersion`, `payloadSchema`, `storeCountry`, plus the journey or aggregation options). `storeCountry` defaults to `true`. There is no reducer: the client replaces state with `{...previous, ...next}`. Also here: `defaultAnalyticsWindow` (grace 7 days, settle 14 days) and `analyticsStateMaxAgeDays(definition, window)`, the staleness rule used by the handler, the expiry job and the dashboard.
- `buckets.ts`: `dayOf(date)` and `isoWeekStart(date)` (UTC, Monday start), `DurationBucket` (`under1h`, `1hTo1d`, `1dTo7d`, `over7d`) with `bucketDuration(ms)`, `DaysBucket` (`d0`, `d1`, `d2To7`, `d8To30`) with `bucketDays(ms)`, `OffersVisibleBucket` (`0`, `1to5`, `6to20`, `21to50`, `51plus`) with `bucketOffersVisible(count)`, and `cappedCounter(max)` (integer schema, 0 to `max`). Further buckets and calendar helpers are added when a definition needs them.
- `definitions/<name>.ts`: one file per definition.
- `registry.ts`: `analyticsDefinitions` (record keyed by name, the server allow-list), `AnalyticsDefinitionName`, `findAnalyticsDefinition(name)` and `decodeAnalyticsPayload(name, schemaVersion, payload)` with the errors `UnknownAnalyticsDefinitionError` and `AnalyticsSchemaVersionMismatchError`.

Not built yet (added with the definitions that need them): `monthOf`, `CountBucket`, `LatencyBucket`, `GapBucket`, `coreAction.ts` (`creationClass`, `requestClass`).

The three definitions of the first slice (from `metrics/acquisition.md`, `metrics/activation.md` and `metrics/marketplace-and-liquidity.md`). Onboarding is a short journey and ends when the post-login flow finishes; activation and retention live on the separate `registrationCohort` journey that starts at registration:

```ts
export const onboardingJourney = defineJourney({
  name: "onboarding",
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: "day",
  state: Schema.Struct({
    step: OnboardingStep, // opened .. onboardingFinished
    reLogin: Schema.optional(Schema.Boolean),
    contactsImport: Schema.optional(ContactsImportOutcome), // success, zero, skipped, denied, error
    notifications: Schema.optional(NotificationsOutcome), // granted, skipped
    openToRegistration: Schema.optional(DurationBucket),
  }),
  terminalStates: ["onboardingFinished"],
});

export const registrationCohortJourney = defineJourney({
  name: "registrationCohort",
  schemaVersion: 1,
  lifetimeDays: 31,
  updatedDayPrecision: "week",
  state: Schema.Struct({
    activatedBy: Schema.optional(ActivatedBy), // offer, request
    activationClass: Schema.optional(ActivationClass), // main, both, club
    registrationToActivation: Schema.optional(DaysBucket),
    d1: Schema.optional(Schema.Boolean),
    d7: Schema.optional(Schema.Boolean),
    d30: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
});

export const marketplaceWeeklyAggregation = defineAggregation({
  name: "marketplaceWeekly",
  schemaVersion: 1,
  period: "week",
  state: Schema.Struct({
    marketplaceOpened: cappedCounter(50),
    firstLoadResult: FirstLoadResult, // offers, empty, notLoaded
    offersVisibleBucket: Schema.optional(OffersVisibleBucket),
  }),
});
```

The retention booleans on `registrationCohort` are optional because they are absent until the day they are evaluated; `d1` etc. are only wired in a later slice. The other `marketplaceWeekly` fields listed in `definitions-index.md` (`clubOffersOpened`, `filteredEmptySeen`, offer demand roll-ups) are added, with a `schemaVersion` bump, when their metrics are implemented.

Schema changes bump `schemaVersion`. The server accepts exactly one version per name; the mobile release that ships a new version must ship before the server drops the old one, so keep a two-version window on the server during rollouts (the registry can hold `previousVersions` for that).

## 6. Client SDK (apps/mobile)

### 6.1 Building blocks that exist

- `atomWithParsedMmkvStorageWithImmediateSaveOption(key, default, schema)` in `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` returns `{atom, setAndSaveImmediatelyAtom}`. The plain `atomWithParsedMmkvStorage` defers writes behind an idle callback; the OS can kill the process first, so the outbox and markers use the immediate-save variant (or `flushNow` on the returned `FlushablePrimitiveAtom`).
- `useAppState` (`apps/mobile/src/utils/useAppState.ts`), already wired in `App.tsx` as `useAppState(setLastTimeAppWasRunningToNow)`. The background flush hooks in beside it.
- `useInAppLoadingTasks` with `requirements: {runOn: 'start', requiresUserLoggedIn: false}` for the start flush.
- `preferencesAtom` (`apps/mobile/src/utils/preferences/index.ts`) for the opt-out toggle.
- `clearMmkvStorageAndEmptyAtoms` wipes all MMKV on logout; `detectMmkvDataLoss.ts` shows that silent wipes happen in the wild. `Intro1Screen` runs the same wipe before login, so it takes `{keepAnalytics: true}` there: the onboarding journey and the `firstOpenAt` marker survive that pre-login clear and nothing else does.
- `getLastTimeAppWasRunning` seeds "new session vs resumed session" for the session tracker.

### 6.2 Local state

All in MMKV, immediate save, all deleted on logout with everything else (`apps/mobile/src/utils/analytics/atoms.ts`, schemas in `domain.ts`):

| Key                  | Content                                                                                                                                        | Leaves device?                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `analyticsMarkers`   | `firstOpenAt`, `registeredAt`, `activatedAt` (exact `UnixMilliseconds`); `firstClubJoinedAt`, `lastCoreActionAt` follow with their definitions | Never. Only buckets derived from them are uploaded. |
| `analyticsInstances` | `Record<id, AnalyticsStateUpsert & {closed, pending: boolean}>`: one entry per open journey instance or aggregation bucket                     | State only; `pending` entries are the outbox.       |
| `analyticsSession`   | Session tracker checkpoint (open session start, accumulated foreground seconds, short ring of session starts). Not built yet.                  | Never raw.                                          |

One record instead of separate journey, aggregation and outbox stores: the entry is the upsert body plus two flags, so a burst of steps before a flush uploads the latest state only and there is nothing to keep in sync. The analytics atoms are never mounted by React; `clearMmkvStorageAndEmptyAtoms` resets them explicitly.

### 6.3 API

One module `apps/mobile/src/utils/analytics/`:

- `instances.ts`: the pure rules, unit tested in `analytics.test.ts`. `applyJourneyStep(definition, current, partial)` merges `{...previous, ...partial}`, validates against the definition schema, bumps `revision`, sets `updatedDay` (ISO week start for `updatedDayPrecision: 'week'`), closes on a terminal `step`, and creates the instance with a fresh uuid v4 and `pending: true` when none is open. A step after the lifetime is ignored and closes the instance. `applyAggregationUpdate(definition, current, initialState, update)` resolves the current bucket (`isoWeekStart(now)` for `week`) and applies the updater; an unchanged state is not queued. `settleInstance` marks an acknowledged revision uploaded and forgets closed instances and ended buckets; `pruneSettledExpired` drops expired entries with nothing left to upload; `pendingUploads` lists the pending entries.
- `report.ts`: `journeyReportActionAtom(definition)` and `aggregationReportActionAtom(definition, initialState)` wrap the rules in jotai action atoms that no-op when analytics is disabled. A journey step forks a flush right away (fire and forget, the caller never waits); an aggregation update only queues. Journey reports take `{onlyIfOpen: true}` for steps that must never start an instance.
- `index.ts`: the per-definition atoms the signal sites call: `reportAppOpenedWhileLoggedOutActionAtom` (sets `firstOpenAt`, starts `onboarding`), `reportOnboardingStepActionAtom` (onboarding steps; never starts an instance and never moves `step` backwards, so a screen shown again is not a drop-off), `reportRegisteredActionAtom` (`registered` with `openToRegistration`, sets `registeredAt`, starts `registrationCohort`), `reportActivationActionAtom` (first core action, guarded by `activatedAt`, writes the cohort activation fields), `reportMarketplaceWeeklyActionAtom`, and the class rules `activationClassForCreatedOffer` (`main` without intended clubs, else `both`) / `activationClassForRequest` (`club` when the offer's `friendLevel` has `CLUB` and no contact degree, else `main`), to move to `coreAction.ts` in the definitions package when it exists.
- `flush.ts`: `flushAnalyticsActionAtom` prunes, then uploads every pending entry through `api.metrics.upsertAnalyticsState`. Success or any 4xx except 429 settles the entry (4xx is reported with `name` and status only); 5xx or a network error keeps it for the next flush. Flushes are serialized through a semaphore, so a step recorded while a request is in flight goes out in the following flush with the latest state instead of racing it (section 6.4).

Signal sites wired for the first slice: `LoginFlow/index.tsx` (`opened`), `Intro1Screen` (`intro` when its action is pressed, after the pre-login clear; the screen's mount effect would run before the parent `LoginFlow` effect that starts the journey), `initPhoneVerificationAtom` (`phoneSubmitted`), `verifyPhoneNumberAtom` (`codeVerified`), `finishLoginActionAtom` (`reLogin` after `checkUserExists`, `registered` in `handleUserCreationActionAtom`), `ContactsImportScreen.tsx` (`contactsImport` outcome, `skipped` on the secondary button), `NotificationSetupScreen.tsx` (`notifications`: `granted` when the permission was granted, otherwise `skipped`), `finishPostLoginFlowActionAtom` (`onboardingFinished`), `createOfferActionAtom` and `sendRequestActionAtom` (activation; re-requests detected through the existing chat for the offer, note requests never reach `sendRequestActionAtom`), `AllOffersActiveEffects` in `MarketplaceScreenContent.tsx` (`marketplaceOpened` on focus), `refreshOffersActionAtom` (first successful load of the week: `firstLoadResult` and `offersVisibleBucket` from `offersToSeeInMarketplaceAtom`, only while the app is active). Club join sites follow with the club definitions.

### 6.4 Flush

- **Journey step**: `journeyReportActionAtom` forks `flushAnalyticsActionAtom` after saving the step; the caller never waits and a failed request leaves the entry pending. The server's `revision` guard drops a late lower revision, and the client serializes flushes, so a burst of steps during one request collapses into a single follow-up request carrying the latest state.
- **App start**: `flushAnalyticsOnStartInAppLoadingTask.ts`, `runOn: 'start'`, no login required, `runAfterOtherTasks` so its random 0 to 60 s delay never holds up another task, then flushes every pending entry (aggregation buckets and any journey state whose immediate upload failed). The delay keeps start flushes from lining up with the refresh calls the app makes at the same moment.
- **Background**: `useFlushAnalyticsOnBackground` (called from `App.tsx`) runs a best-effort flush of pending entries with a 5 s timeout on `background` (not iOS `inactive`). Losing it is fine; the next start catches up.
- No background task, no push-driven flush: those entry points return control to the OS unpredictably and the existing `flushAllScheduledMmkvWrites` note in `atomWithParsedMmkvStorage.ts` shows why.

### 6.5 Pre-login reporting

The onboarding journey starts before a session exists. The rest-api client for the new endpoint must build the request with `makeCommonHeaders` only and must not call `getUserSessionCredentials` (which logs a warning and substitutes `dummySession` when logged out). Implement it as a separate function in `packages/rest-api/src/services/metrics/index.ts` that takes no `getUserSessionCredentials`.

### 6.6 Opt-out

- `preferencesAtom.analyticsEnabled`, default `true`, toggle in App settings (`AppSettingsDefaultScreen.tsx`, `analyticsEnabledAtom`) with the note `appSettings.anonymousUsageStatisticsNote`.
- Turning it off: clear the outbox, delete all journey and aggregation ids locally, stop recording. Rows already on the server keep their last state and expire normally; nothing can update them anymore.
- Turning it on again starts fresh instances. The opt-out state itself is never reported and there is no "opted out" row.

### 6.7 Failure modes

| Situation                                          | Effect                                                                                                                                          | Dashboard handling                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Logout (`clearMmkvStorageAndEmptyAtoms`)           | All local analytics state gone; open journeys stay at their last server state.                                                                  | Counted as `unknown` outcome once the cohort matures.                   |
| Reinstall or silent MMKV loss                      | Same as logout; the next open is a new instance with new ids.                                                                                   | Same. Re-login is a new instance, never a continuation.                 |
| Immediate journey upload fails (offline, 5xx, 429) | Entry stays pending; the next journey step, background or start flush retries it with the latest state.                                         | None; the row lags by at most one session.                              |
| Process killed before flush                        | Outbox is durable (immediate save); state uploads on next start.                                                                                | None.                                                                   |
| Offline for days                                   | Outbox grows bounded by the number of open journeys plus buckets (one entry per id). Entries older than lifetime or settle are dropped locally. | Late aggregation flushes land inside the settle period or are rejected. |
| Server rejects (4xx except 429)                    | Entry dropped, error reported with `name` and status only. A 429 is kept for the next flush.                                                    | Missing row.                                                            |
| Clock skew on device                               | `updatedDay` may be off by a day; server tolerates one day forward.                                                                             | Day-level noise, acceptable.                                            |

Every cohort therefore has an explicit `unknown` bucket: journeys that reached the end of their lifetime without a terminal step. Churn read from last states is an upper bound that includes reinstalls, logouts, opt-outs and data loss.

## 7. Dashboard rules

- **Population label**: every chart states its population as "reporting instances" (with analytics enabled, on a release line that ships the definition), never "users". Backend counts (`NUMBER_OF_USERS`, `COUNT_OF_ACTIVE_USERS`) are shown separately and never used as a denominator for frontend rows.
- **Small-group suppression**: any group (cohort week, platform, release line, state value) with fewer than 20 reporting instances (placeholder, tunable) is hidden or merged into "other". Country is the dimension most likely to trip this; small countries roll up into a region or "other". Applied after filtering, so drilling down cannot reveal a suppressed group.
- **Maturity**: journey cohorts are shown only after `lifetimeDays + graceDays` since the cohort's last possible `startDay`; aggregation buckets only after `bucketEndDay + settleDays`. Immature buckets are drawn as provisional or not at all. `isWeekProvisional` in `apps/backoffice-app/src/server/analytics/rules.ts` derives both from `analyticsStateMaxAgeDays(definition, defaultAnalyticsWindow)`, the same rule the server uses to reject stale uploads.
- **Outcome categories**: terminal states, `open` (still within lifetime), `unknown` (lifetime elapsed without terminal step). Never label `unknown` as churn.
- **Read path**: the admin-only `/analytics` page of `apps/backoffice-app` reads the metrics database over a separate read-only connection (`METRICS_DB_HOST`, `METRICS_DB_PORT`, `METRICS_DB_USER`, `METRICS_DB_PASSWORD`, `METRICS_DB_NAME`; minimum group size `ANALYTICS_MIN_GROUP_SIZE`, default 20). Queries live in `apps/backoffice-app/src/server/analytics/`: one SQL statement per definition counts payload values per ISO week and country, and the query layer applies suppression, maturity and outcome categories before anything leaves the server. Where a metric is `mixed`, the backend part comes from the existing `metrics` table.

## 8. Privacy analysis

Attacker model: full read access to `analytics_states` (dump, backup, or a compromised dashboard credential).

What they learn per row: platform, release line (`YY.M`), phone country prefix (`none` for club definitions), a definition name, a start day, an update day (week for long journeys), and a small enum or capped-counter state. For live rows, a random id with no meaning outside the device.

What they cannot learn:

- Who the instance is: no phone number, no hash, no IP, no device model, no installation id, no session token. Country prefix is the only demographic column.
- When exactly anything happened: day or week granularity only; the only sub-day information is the upload itself, which is not stored.
- Whether two rows belong to the same device: ids are independent random values per instance and per bucket, and the row attributes are limited to platform, release line and country prefix. For large countries that is a group of thousands; for small countries it is not, which is why suppression is mandatory on every read path.

Linkability across rows: two rows share nothing but `(app_platform, app_major_version, country_prefix, start_day)`. In a small population (a new release line on its first day, a small country) that tuple can be a group of one; the suppression rule in section 7 hides it on dashboards, but the raw table still holds it. Mitigation is population size, not schema; do not add dimensions.

Timing joins with backend rows: backend metrics (`USER_LOGGED_IN`, `OFFER_CREATED`, `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`) carry exact timestamps and country. Journey steps are uploaded as they happen, so an `onboarding` or `registrationCohort` row is written within seconds of the `USER_LOGGED_IN` metric row, and an attacker with the database could in principle pair the two through Postgres write order (`xmin`, the `pk` sequence, backups taken at known times) or through access logs (upload time and IP). The accepted mitigations: `analytics_states` has no timestamp column, so write order must be reconstructed from side channels instead of read from the row; the ingress requirement in section 4.5 keeps access logs short-lived and free of headers; and a successful pair yields only what the metric row already knows (country, exact time) plus the journey state, never a new identifier. This trade-off was taken deliberately: delaying the first upload to the next app start made a user who churns in their first session invisible, which defeats the purpose of journeys.

Small groups: clubs are tiny, so club journeys carry no country, no version and `updatedDay` at week precision. Long-lived journeys are the most linkable objects in the system because a random id lives for 30 days; they carry booleans and enums only, one journey per milestone, never chained.

Endpoint abuse: the endpoint is unauthenticated, so anyone can write junk. Schema validation, caps, the 4 KB body limit and per-IP rate limiting bound the damage to noise, and the dashboard's suppression and maturity rules bound the effect of a burst. Nothing in the payload can point at another user's data.

## 9. Work items

In dependency order. Each item ends with the verification steps from `AGENTS.md`.

**packages/analytics-definitions**

- [x] Scaffold package (mirror `packages/generic-utils/package.json`, depend on `effect` only).
- [x] `buckets.ts` (`dayOf`, `isoWeekStart`, duration, days and offers-visible buckets, `cappedCounter`) with tests around year boundaries and cap edges.
- [x] `defineJourney`, `defineAggregation`, `registry.ts`, `decodeAnalyticsPayload`.
- [ ] `coreAction.ts` with the creation and request class rules.
- [x] First definitions: `onboarding` and `registrationCohort` journeys, `marketplaceWeekly` aggregation. Further definitions (and the buckets they need) follow the metric files one category at a time.

**packages/rest-api**

- [x] `AnalyticsStateUpsert` body schema (in the definitions package) and `InvalidAnalyticsStateError` in `services/metrics/contracts.ts`.
- [x] `PUT /analytics/state` endpoint in `services/metrics/specification.ts` with `CommonHeaders`, `MaxExpectedDailyCall`, 400 error. 413 comes from the body size cap in the server or the platform, not from the spec.
- [x] Session-free client function `upsertAnalyticsState` in `services/metrics/index.ts` (the metrics client never reads session credentials).

**apps/metrics-service**

- [x] Migration `0004_add_analytics_states_table.ts`, registered in `db/layer.ts`.
- [x] `MetricsDbService` queries: `upsertAnalyticsState`, `expireAnalyticsStateIds`, `deleteExpiredAnalyticsStates`.
- [x] Route handler: body size guard, registry lookup, `Schema.decodeUnknown` with excess property error, staleness check, extraction of platform and release line only.
- [x] Daily expiry and retention task via `makeRepeatingTaskLayer` (`analyticsExpiryWorker.ts`).
- [x] Config: `ANALYTICS_GRACE_DAYS`, `ANALYTICS_SETTLE_DAYS`, `ANALYTICS_RETENTION_DAYS`, `ANALYTICS_EXPIRY_CRON`.
- [x] Add a pointer to this document in `docs/backend_stats.md`.
- [x] Handler tests (`src/__tests__/routes/upsertAnalyticsState.test.ts`) and expiry job test, on the jest harness added to the service.

**apps/mobile**

- [x] `analyticsEnabled` in `preferencesAtom` and the Settings toggle (follow `docs/ui_coding_guideline.md`).
- [x] Markers and instances atoms with `atomWithParsedMmkvStorageWithImmediateSaveOption` (section 6.2).
- [x] `apps/mobile/src/utils/analytics/` module (section 6.3) with unit tests for the pure rules and the flush outcomes.
- [x] Start flush as an in-app loading task (`runOn: 'start'`, `requiresUserLoggedIn: false`); background flush via `useAppState` in `App.tsx`.
- [ ] Session tracker beside `useAppState(setLastTimeAppWasRunningToNow)` (from `metrics/sessions.md`).
- [x] Hook signal sites listed in section 6.3 for the three definitions of the first slice.
- [x] Verify logout path leaves nothing behind (test in `analytics.test.ts`; the pre-login clear in `Intro1Screen` keeps analytics on purpose).

**apps/backoffice-app**

- [x] Read-only metrics database connection (`runMetricsDb`) and query helpers.
- [x] Suppression, maturity and population labelling as shared helpers used by every analytics chart.
- [x] First charts: onboarding funnel by cohort week, registration to activation by cohort week, marketplace first load by week (with country breakdown).
- [ ] Weekly core-active instances chart (needs its definition first).

**infrastructure (separate repo)**

- [ ] Access-log exclusion or short retention for `/analytics/state`.
- [ ] Rate limit values and body size cap in the environment.
- [ ] Database role for the dashboard read path: a read-only role on the metrics database, wired into the backoffice deployment as `METRICS_DB_HOST`, `METRICS_DB_PORT`, `METRICS_DB_USER`, `METRICS_DB_PASSWORD`, `METRICS_DB_NAME` (optional `ANALYTICS_MIN_GROUP_SIZE`).

## 10. Decisions made in this document

Recorded so they are not re-litigated in review:

- Journeys store both `startDay` and `updatedDay`; long journeys round `updatedDay` to week.
- `revision` (client counter per id) resolves retry ordering; there is no server-side timestamp.
- Buckets are UTC.
- `app_major_version` stores the CalVer release line `YY.M`.
- Rejected payloads are dropped, not dead-lettered.
- Journey steps are uploaded right away; aggregations are flushed on app start and best effort on background. The first upload of a journey can be paired by write order with the backend row of the same action; this trade-off is accepted and analysed in section 8.
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
