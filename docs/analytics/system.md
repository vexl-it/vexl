# Frontend analytics system design

Design for the privacy-aware client analytics described in `README.md`. `metrics.md` and `definitions.md` say _what_ to collect; this document says _how_.

## 1. Goals and constraints

Goal: answer the business questions in `metrics.md` (funnels, cohorts, activity, retention and reactivation) without the server ever holding a record that describes an identifiable user or device.

Hard constraints (not negotiable, every work item below must respect them):

1. **No exact event timestamps leave the device.** Only calendar buckets: day (`YYYY-MM-DD`), ISO week (`YYYY-Www`) or month (`YYYY-MM`). Durations are bucketed on the client before upload.
2. **No per-user or per-device id on the server.** Every id is scoped to one journey instance or one calendar bucket, is random, and expires with it. Two rows from the same device never share an id or any attribute that could link them beyond platform and release line.
3. **Users opt in** on the first screen or in settings; analytics is off by default. Opt-in is the only sampling mechanism; there is no server-side or client-side sampling on top of it.

Secondary goals: one server primitive, one shared definitions package, and a client that keeps working offline and before login.

What we deliberately do not measure, and why, is in `metrics.md`.

## 2. Concepts

| Concept                | Meaning                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Journey**            | One instance of a predefined flow on one device (one onboarding, one offer, one request). The client owns a random `journeyId`, keeps the whole state locally, and every upload _replaces_ the state under that id. The server keeps only the latest state. The last state of a journey that never reached a terminal step is the churn signal. |
| **Journey lifetime**   | Declared per definition (1 to 37 days, counted from `startDay`). After the terminal step or the lifetime, the client deletes the id. The server nulls the id after lifetime plus grace so the row can never be updated or linked again.                                                                                                         |
| **Aggregation**        | Per absolute calendar bucket the client keeps capped counters and small enums, and upserts them under a random per-bucket id. One row per reporting instance per bucket. Once the bucket is closed and the final flush acknowledged, the client drops the id.                                                                                   |
| **Bucket**             | Calendar-aligned, UTC based: day, ISO week (Monday start) or month. Buckets are absolute, never relative to install or registration.                                                                                                                                                                                                            |
| **Settle period**      | Time after a bucket closes during which late flushes can still arrive (14 days, tunable). Dashboards show a bucket as final only after it.                                                                                                                                                                                                      |
| **Reporting instance** | One app install with analytics enabled that uploaded at least one row for the population in question. All dashboard populations are counted in reporting instances, never in users.                                                                                                                                                             |
| **Core action**        | Offer created, request sent or request approved. This and the other metric terms (main / Club, activation, retention, dormancy) are decisions in `metrics.md`; the main / Club rules are in `definitions.md`.                                                                                                                                   |

Long-lived journeys (lifetime over 7 days) carry booleans and enums only in the payload; country, platform and release line are row columns, never payload fields. They never carry free numbers. Short journeys and aggregations may carry capped counters and duration buckets.

## 3. Data flow

```
 mobile app                          metrics-service                    dashboard
 ----------                          ---------------                    ---------
 signal site (e.g. createOffer ok)
   | record step / bump counter
   v
 outbox in MMKV (immediate save)
   | flush: journey step (right away, journey entries only),
   | app start (reliable), app background (best effort)
   v
 OHTTP-encrypted {client, state}  ---> relay (third party, sees IP only)
   (no Vexl headers)                              |  POST /analytics/ohttp + relay token
                                                  v
                                          gateway: decrypt, validate name + schema
                                                  |  (sees relay IP only)
                                                  v
                                          analytics_states (upsert by id)
   <---  200 / 4xx / 5xx  ------------------    |
   | 200: mark acknowledged, drop id if closed   | daily job: null expired ids,
   | 400 / 413: drop from outbox                 |            delete old rows
   | anything else / offline: keep, retry        v
                                          read-only queries  ------------------>  charts with
                                                                                   suppression + maturity
```

Upload timing: a journey step forks a flush right away (fire and forget; a failed request leaves the entry in the outbox for the next start or background flush). The flush a journey step triggers sends journey entries only. Aggregation updates only queue and go out with the next start or background flush, so a bucket never travels in the same burst as a journey step. Flushes are serialized, so several steps recorded during one request go out as a single follow-up request with the latest state. The first upload of a journey therefore lands within seconds of the backend row of the same action (`USER_LOGGED_IN`, `OFFER_CREATED`, `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`); section 8 records why that is accepted.

## 4. Server

### 4.1 Endpoint contract

One endpoint on metrics-service, defined in `packages/rest-api/src/services/metrics/specification.ts` next to `reportNotificationInteraction`. It is an Oblivious HTTP gateway (section 4.5): the client never calls it directly, it sends through an analytics relay run by a third party, so Vexl never sees the client IP.

- Method and path: `POST /analytics/ohttp` (name `relayAnalyticsState`), body `message/ohttp-req`. There is no direct, non-relayed upload path.
- Headers: only `x-relay-token`, which the relay adds. Unknown or missing token: 403. No `CommonHeaders`, no session; callable before login.
- Middleware: `RateLimitingMiddleware`. Every request comes from a relay, so the per-IP limit (`MaxExpectedDailyCall` 1 000 000) is a per-relay cap.
- Body: the RFC 9458 request encapsulation (suite X25519, HKDF-SHA256, ChaCha20Poly1305, `packages/cryptography/src/operations/ohttp.ts`) of `RelayedAnalyticsState` JSON: `{client: {platform, semver, prefix?}, state}`, padded with spaces to a multiple of 1 KB so the relay cannot tell definitions apart by size. The plaintext is JSON, not Binary HTTP; relays never see it, so this does not affect relay compatibility.
- Body size: hard cap 4 KB plaintext plus the encapsulation overhead. A request whose `content-length` exceeds it is answered with 413 before the body is read. The payload cap is enforced again by the schema (max 64 keys, strings max 32 chars, integers max 1 000).
- Success: `NoContentResponse` (200 with an empty body). The response is not encapsulated: it carries only the status.

`state` body:

| Field           | Type                         | Rules                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `AnalyticsStateId`           | Client-generated random uuid v4, one per journey instance or per aggregation bucket. A string brand defined in the definitions package (it cannot depend on `domain`).                                                                                                                                                                                                                        |
| `kind`          | `'journey' \| 'aggregation'` | Must match the definition registered under `name`.                                                                                                                                                                                                                                                                                                                                            |
| `name`          | string, at most 64 chars     | Must be in the definitions allow-list. Unknown name: 400.                                                                                                                                                                                                                                                                                                                                     |
| `schemaVersion` | integer                      | Must equal the version the server knows for `name`. Older versions: 400 (client drops the row).                                                                                                                                                                                                                                                                                               |
| `revision`      | integer, 0 or more           | Per-id counter incremented by the client on every state change. Server ignores an upsert whose revision is lower than the stored one (retries arriving out of order). Not a timestamp.                                                                                                                                                                                                        |
| `startDay`      | `YYYY-MM-DD`                 | Journey: day the journey instance started. Aggregation: first day of the bucket.                                                                                                                                                                                                                                                                                                              |
| `updatedDay`    | `YYYY-MM-DD`                 | Day of the last local state change. The client sends the day, or the ISO week start for journeys with `updatedDayPrecision: 'week'`, and never a day earlier than `startDay`: in a journey's first week it equals `startDay`. The server accepts `>= startDay`, and for week precision also the ISO week start of `startDay`. Both dates may be at most one day in the future for clock skew. |
| `payload`       | object                       | Validated with the definition's effect Schema, `onExcessProperty: 'error'`. Extra or unknown fields: 400.                                                                                                                                                                                                                                                                                     |

Errors: 400 invalid, undecryptable or stale (`startDay` older than lifetime plus grace, unknown name, schema mismatch, `kind` not matching the definition or an existing row, aggregation `startDay` not the first day of its bucket), 403 unknown relay, 413 too large, 429 rate limited, 503 encrypted to a key id the gateway does not hold, 500 unexpected. The client drops the outbox entry on 400 and 413 only; anything else (a relay or gateway problem) or a network failure is retried at the next flush.

### 4.2 Table `analytics_states`

New table in metrics-service (migration `0004_add_analytics_states_table.ts`, registered in `apps/metrics-service/src/db/layer.ts`). The existing `metrics` table is not used: it has an exact `timestamp` column and the notification `trackingId` convention, both incompatible with this design.

| Column              | Type            | Notes                                                                                                                                                                                                                                                          |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pk`                | bigint identity | Primary key. Row order is a weak write-order side channel, accepted (see section 8).                                                                                                                                                                           |
| `id`                | uuid, nullable  | Client id. Partial unique index `WHERE id IS NOT NULL`. Set to null by the expiry job; a nulled row can never be matched again.                                                                                                                                |
| `kind`              | varchar         | `journey` or `aggregation`.                                                                                                                                                                                                                                    |
| `name`              | varchar         | Definition name.                                                                                                                                                                                                                                               |
| `schema_version`    | integer         | Version of the payload schema at write time.                                                                                                                                                                                                                   |
| `revision`          | integer         | Last accepted client revision.                                                                                                                                                                                                                                 |
| `start_day`         | date            | See contract.                                                                                                                                                                                                                                                  |
| `updated_day`       | date            | See contract.                                                                                                                                                                                                                                                  |
| `payload`           | jsonb           | Validated state.                                                                                                                                                                                                                                               |
| `app_platform`      | varchar         | `IOS` / `ANDROID` from `client.platform`.                                                                                                                                                                                                                      |
| `app_major_version` | varchar         | Release line `YY.M` from `client.semver` (CalVer: the first component alone is the year and carries no information).                                                                                                                                           |
| `country_prefix`    | varchar         | Phone country prefix from `client.prefix`, `none` fallback. Definitions with `storeCountry: false` are stored as `none` (none of the current ones). Decision: country is stored on journeys and aggregations alike, and the dashboard suppresses small groups. |

No `created_at`, no `updated_at`, no IP, no version code, no app source, no language, no device model, no OS version. The client sends only `client.platform`, `client.semver` and `client.prefix` inside the encrypted body, never `vexl-app-meta`.

Indexes: `(name, start_day)` for dashboard reads; partial unique on `id`.

Upsert semantics: `INSERT ... ON CONFLICT (id) DO UPDATE SET payload, revision, updated_day, schema_version, app_platform, app_major_version, country_prefix WHERE excluded.revision >= analytics_states.revision AND analytics_states.kind = excluded.kind AND analytics_states.name = excluded.name`. A conflicting `kind` or `name` is a 400, not an update.

### 4.3 Validation

- The server imports the definition registry from the definitions package (section 5). Validation is `decodeAnalyticsPayload(name, schemaVersion, payload)`, which looks the name up, checks the schema version and runs `Schema.decodeUnknown(definition.payloadSchema, {onExcessProperty: 'error'})`. Any of its three failures (`UnknownAnalyticsDefinitionError`, `AnalyticsSchemaVersionMismatchError`, `ParseError`) maps to `InvalidAnalyticsStateError` (400).
- `kind` must match the definition, and an aggregation's `startDay` must be `bucketStartDay(period, startDay)` (the day, ISO week Monday or first of the month). Both map to `InvalidAnalyticsStateError` (400).
- Rejected rows are not stored anywhere (no equivalent of `dead_metrics`): a rejected payload is exactly the kind of data we do not want on disk. Log a warning with `name` and the error tag only, never the payload.
- Staleness: reject when `today - startDay > lifetimeDays + graceDays` (journeys) or `today - bucketEndDay > settleDays` (aggregations). This closes the window in which a nulled id could be re-created as a new row. The rule is `analyticsStateMaxAgeDays` in the definitions package, shared with the expiry job and the dashboard maturity rule.

### 4.4 Expiry and retention job

One daily task via `makeRepeatingTaskLayer` (`packages/server-utils/src/repeatingTask.ts`, Redis locked, cron `15 3 * * *` UTC):

1. `UPDATE analytics_states SET id = NULL WHERE id IS NOT NULL AND kind = 'journey' AND start_day < today - (lifetimeDays + graceDays)` per definition (grace 7 days).
2. Same for aggregations, counted from the bucket end day: `start_day < today - (periodDays - 1 + settleDays)`, the same rule the handler uses for staleness (`periodDays` is 1 for day, 7 for week and 31 for month buckets).
3. `DELETE FROM analytics_states WHERE start_day < today - retentionDays` (retention 540 days, tunable). Dashboards that need longer history must materialize aggregates, not keep raw rows.

Retention policy in one line: a row keeps its id for at most lifetime plus grace, keeps its payload for at most `retentionDays`, and never gets a timestamp added.

### 4.5 Transport: Oblivious HTTP relay

Goal: the Vexl server is technically unable to see the client IP of an analytics upload, without users having to trust Vexl.

```
 app --(client IP, encrypted blob)--> relay --(relay IP, blob, x-relay-token)--> gateway (metrics-service)
```

- The app encrypts each upload to the gateway's public key config and posts it to a randomly chosen relay. The relay sees the client IP and an opaque blob; the gateway sees the content and only the relay IP. This holds as long as the relay operator does not collude with Vexl, so production relays must be run by independent parties, never by Vexl.
- The relay is `tooling/ohttp-relay/Caddyfile`: one path, POST only, 8 KB cap, every client header dropped, no access or error logs, the relay's token added. The same file runs in local dev (`ohttp-relay` in `docker-compose.dev.yaml`), on staging and at partners.
- Gateway keys: `ANALYTICS_OHTTP_GATEWAY_SECRETS` (comma-separated; hold the current and the next key during a rotation). Relay tokens: `ANALYTICS_RELAY_TOKENS` (comma-separated, one per relay). Generate a key with `pnpm --filter @vexl-next/cryptography generate:ohttp-key <keyId>`.
- Client config: `analytics-relays.json` at the repo root, with relay URLs (https only) and the public key config per environment (`stage`, `prod`) and a `revision`. The app bundles the file at build time and, when statistics are on, fetches it from `raw.githubusercontent.com` (`main`) at most once a day; it uses the fetched copy only when its `revision` is higher than the bundled one, and keeps the last good copy when a fetch fails. Every user must get the same key config, otherwise per-user keys could tag users: the file is public, so every change is visible in git history, and it is never served by Vexl. Bump `revision` on every change and only ever add fields, since old apps keep reading it. An environment without an entry has uploads disabled (prod for now). Local dev reads the relay from `EXPO_PUBLIC_LOCAL_ANALYTICS_*` (generated by `pnpm dev:mobile`) and never fetches.
- The fetch tells GitHub the IP and time of opted-in installs once a day. It runs at app start, before the randomly delayed upload, so the two requests do not line up.
- What still leaks: the relay sees client IP, time and size; Vexl sees arrival time. Journey steps are uploaded right away, so arrival time can still be correlated with authenticated traffic from the same device (section 8). The service's `HttpMiddleware.logger` logs method and path only; never add header logging.

## 5. Definitions package

`packages/analytics-definitions` (`@vexl-next/analytics-definitions`). Platform-agnostic, depends only on `effect`. Consumers: `apps/mobile` (produce), `apps/metrics-service` (validate and store), `apps/backoffice-app` (read and label). Import style: `@vexl-next/analytics-definitions/src/<file>`.

What lives there:

- `core.ts`: `AnalyticsKind`, `DayString` (`YYYY-MM-DD` brand), `AnalyticsStateId` (uuid v4 brand), `AnalyticsStateUpsert` (the request body schema, `payload: Schema.Unknown`), `defineJourney({name, schemaVersion, lifetimeDays, updatedDayPrecision, storeCountry?, state, terminalStates})` and `defineAggregation({name, schemaVersion, period, storeCountry?, state})`. Both take the payload as one `Schema.Struct` (`state`) and return a plain definition object (`kind`, `name`, `schemaVersion`, `payloadSchema`, `storeCountry`, plus the journey or aggregation options). `storeCountry` defaults to `true`. There is no reducer: the client replaces state with `{...previous, ...next}`. Also here: `defaultAnalyticsWindow` (grace 7 days, settle 14 days) and `analyticsStateMaxAgeDays(definition, window)`, the staleness rule used by the handler, the expiry job and the dashboard.
- `buckets.ts`: `dayOf(date)` and `isoWeekStart(date)` (UTC, Monday start), `bucketStartDay(period, now)` (first day of the day, week or month bucket), `updatedDayFor(precision, startDay, now)` (the day or ISO week start of `now`, never earlier than `startDay`), `DurationBucket` (`under1h`, `1hTo1d`, `1dTo7d`, `over7d`) with `bucketDuration(ms)`, `DaysBucket` (`d0`, `d1`, `d2To7`, `d8Plus`) with `bucketDays(days)` and `utcDaysBetween(from, to)` (UTC calendar days), `OffersVisibleBucket` (`0`, `1to5`, `6to20`, `21to50`, `51plus`) with `bucketOffersVisible(count)`, the further buckets of `definitions.md` (`RequestCountBucket`, `ClubCountBucket`, `TenureBucket`, `DormancyBucket` with their `bucket…` helpers, `NotificationCategory`, `AfterOpenAction`), and `cappedCounter(max)` (integer schema, 0 to `max`).
- `coreAction.ts`: the main / Club rules from `definitions.md` (`createdOfferClass`, `sentRequestClass`, `approvedRequestClass`), and `coreActivityFields` with the `markCoreAction` updater shared by the activity aggregations.
- `definitions/<name>.ts`: one file per definition, exporting the definition and its state type (`onboardingJourney` and `OnboardingState`, for example). `definitions/index.ts` holds `analyticsDefinitions` (record keyed by name, the server allow-list) and `RegisteredAnalyticsDefinition`.
- `registry.ts`: `findAnalyticsDefinition(name)` and `decodeAnalyticsPayload(name, schemaVersion, payload)` with the errors `UnknownAnalyticsDefinitionError` and `AnalyticsSchemaVersionMismatchError`.
- `testDefinitions.ts`: test-only definitions. Mobile and metrics-service tests mock `definitions/index.ts` with it, so the transport and storage tests do not depend on real definitions.

Schema changes bump `schemaVersion`. The server accepts exactly one version per name; the mobile release that ships a new version must ship before the server drops the old one, so keep a two-version window on the server during rollouts (the registry can hold `previousVersions` for that).

## 6. Client SDK (apps/mobile)

### 6.1 Building blocks that exist

- `atomWithParsedMmkvStorageWithImmediateSaveOption(key, default, schema)` in `apps/mobile/src/utils/atomUtils/atomWithParsedMmkvStorage.ts` returns `{atom, setAndSaveImmediatelyAtom}`. The plain `atomWithParsedMmkvStorage` defers writes behind an idle callback; the OS can kill the process first, so the outbox and markers use the immediate-save variant (or `flushNow` on the returned `FlushablePrimitiveAtom`).
- `useAppState` (`apps/mobile/src/utils/useAppState.ts`), already wired in `App.tsx` as `useAppState(setLastTimeAppWasRunningToNow)`. The background flush hooks in beside it.
- `useInAppLoadingTasks` with `requirements: {runOn: 'start', requiresUserLoggedIn: false}` for the start flush.
- `preferencesAtom` (`apps/mobile/src/utils/preferences/index.ts`) for the opt-in toggle.
- `clearMmkvStorageAndEmptyAtoms` wipes all MMKV on logout; `detectMmkvDataLoss.ts` shows that silent wipes happen in the wild. `Intro1Screen` runs the same wipe before login, so it takes `{keepAnalytics: true}` there: the opt-in, the onboarding journey, its markers and the outbox survive that pre-login clear and nothing else does.
- `getLastTimeAppWasRunning` cannot detect dormancy: it is overwritten on mount and by iOS background launches. The `reactivation` journey needs its own `lastForegroundAt` marker, set only on AppState `active`.

### 6.2 Local state

All in MMKV, immediate save, all deleted on logout with everything else (`apps/mobile/src/utils/analytics/atoms.ts`, schemas in `domain.ts`):

| Key                  | Content                                                                                                                              | Leaves device?                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `analyticsMarkers`   | `firstOpenAt`, `registeredAt`, `activatedAt`, `clubActivatedAt`, `firstClubJoinedAt`, `lastForegroundAt` (exact `UnixMilliseconds`). | Never. Only buckets derived from them are uploaded. |
| `analyticsInstances` | `Record<id, AnalyticsStateUpsert & {closed, pending: boolean}>`: one entry per open journey instance or aggregation bucket           | State only; `pending` entries are the outbox.       |

One record instead of separate journey, aggregation and outbox stores: the entry is the upsert body plus two flags, so a burst of steps before a flush uploads the latest state only and there is nothing to keep in sync. The analytics atoms are never mounted by React; `clearMmkvStorageAndEmptyAtoms` resets them explicitly.

### 6.3 API

One module `apps/mobile/src/utils/analytics/`:

- `instances.ts`: the pure rules, unit tested in `analytics.test.ts`. `applyJourneyStep(definition, current, partial)` merges `{...previous, ...partial}`, validates against the definition schema, bumps `revision`, sets `updatedDay` with `updatedDayFor` (for `updatedDayPrecision: 'week'` the later of the ISO week start and `startDay`), closes on a terminal `step`, and creates the instance with a fresh uuid v4 and `pending: true` when none is open. A step after the lifetime is ignored and closes the instance. `applyAggregationUpdate(definition, current, initialState, update)` resolves the current bucket (`isoWeekStart(now)` for `week`) and applies the updater. The result is compared with the previous state by value (`Schema.equivalence` of the payload schema); an equal state changes nothing, so a counter sitting at its cap neither bumps the revision nor marks the bucket pending. `settleInstance` marks an acknowledged revision uploaded and forgets closed instances and ended buckets; `pruneSettledExpired` drops expired entries with nothing left to upload; `pendingUploads(instances)` lists the pending entries.
- `report.ts`: `journeyReportActionAtom(definition)` and `aggregationReportActionAtom(definition, initialState)` wrap the rules in jotai action atoms that no-op when analytics is disabled. A journey step forks a flush of the journey entries right away (fire and forget, the caller never waits); an aggregation update only queues. Journey reports take `{onlyIfOpen: true}` for steps that must never start an instance.
- One module per definition (`onboarding.ts`, `offer.ts`, `request.ts`, `reactivation.ts`, `notificationOpen.ts`, `prompt.ts`, `activity.ts`) with the report atoms the signal sites call. `coreAction.ts` classifies every core action once and fans it out to all definitions that use it; `afterOpenAction.ts` does the same for the actions after a notification open or a return. `analyticsActionAtom.ts` wraps every report so it no-ops while analytics is off and never throws into the calling flow.
- `relayConfig.ts`: `analyticsRelayAtom` picks the relays for the environment from the bundled or fetched `analytics-relays.json`; `refreshAnalyticsRelaysActionAtom` refetches it at most once a day (section 4.5).
- `relay.ts`: `uploadAnalyticsStateAtom` encrypts one state with the client info and posts it to a random relay (section 4.5), with no other headers. `Option.none()` when the environment has no relay.
- `flush.ts`: `flushAnalyticsActionAtom` prunes, then uploads pending entries through `uploadAnalyticsStateAtom`; with no relay configured it uploads nothing. Journey-triggered flushes only upload journeys; lifecycle flushes include aggregations. Before each request it checks consent and reads the current outbox entry, so clearing the outbox also stops entries captured by an earlier flush. Success, 400 or 413 settles the entry (a rejection is reported with `name` and status only); any other status or a network error keeps it for the next flush. Flushes are serialized through a semaphore, so a step recorded while a request is in flight goes out in the following flush with the latest state instead of racing it (section 6.4).

Signal sites are listed per field in `definitions.md`.

### 6.4 Flush

- **Journey step**: `journeyReportActionAtom` forks `flushAnalyticsActionAtom` for journey entries after saving the step; the caller never waits and a failed request leaves the entry pending. Pending aggregation buckets stay in the outbox until the next start or background flush. The server's `revision` guard drops a late lower revision, and the client serializes flushes, so a burst of steps during one request collapses into a single follow-up request carrying the latest state.
- **App start**: `flushAnalyticsOnStartInAppLoadingTask.ts`, `runOn: 'start'`, no login required, `runAfterOtherTasks` so its random 0 to 60 s delay never holds up another task, then flushes every pending entry (aggregation buckets and any journey state whose immediate upload failed). The delay keeps start flushes from lining up with the refresh calls the app makes at the same moment.
- **Background**: `useFlushAnalyticsOnBackground` (called from `App.tsx`) runs a best-effort flush of pending entries with a 5 s timeout on `background` (not iOS `inactive`). Losing it is fine; the next start catches up.
- No push-driven flush and no background task: those entry points return control to the OS unpredictably and the existing `flushAllScheduledMmkvWrites` note in `atomWithParsedMmkvStorage.ts` shows why.

### 6.5 Pre-login reporting

The onboarding journey starts when the user leaves the first screen (`Intro1Screen`) with statistics turned on (section 6.6). Turning the toggle on and off there records nothing, so flipping it leaves no abandoned journeys on the server. Nothing is recorded or buffered before that. Uploads go through the relay with no session or Vexl headers (section 4.5), so the only difference before login is that rows carry no country (section 6.8).

The first screen's Continue button wipes storage before login. It passes `{keepAnalytics: true}`, so the opt-in, the started journey, its markers and the outbox survive and the journey continues on the next screen. The preferences atom is mounted, so the clear resets it in memory; `clearMmkvStorageAndEmptyAtoms` writes `analyticsEnabled` back and saves it right away.

### 6.6 Opt-in

- `preferencesAtom.analyticsEnabled`, default `false`. Two toggles write it through `analyticsOptInAtom` (`optIn.ts`), so they are one setting: one on the first screen (`Intro1Screen.tsx`, `loginFlow.v2.intro1.shareUsageStatistics`) and one in App settings (`AppSettingsDefaultScreen.tsx`) with the note `appSettings.anonymousUsageStatisticsNote`.
- The first screen's Continue button reports the first open (`firstOpenAt` marker and `step: 'opened'`) while analytics is on, unless a `firstOpenAt` marker exists. The toggles themselves start nothing, so turning it on after login starts no onboarding journey: the user is past onboarding and would show up as a new install.
- Turning it off: clear the outbox, delete all journey and aggregation ids locally, stop recording. A request already in flight may finish, but the flush starts no further requests for the cleared entries, even if analytics is turned on again. Rows already on the server expire normally.
- Turning it on again starts fresh instances. The toggle state itself is never reported and there is no "opted out" row.

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

### 6.8 Reading the onboarding rows

Three behaviours follow from where the signals sit. They are correct, and whoever reads the funnel has to know them.

- **No country before registration.** The app derives the phone prefix from the session (`apiAtom` reads `sessionHolderAtom`), and no session exists before login. Every onboarding upload before registration goes out without a prefix, so the row is stored with `country_prefix = none`. The upload of the `registered` step is the first one that carries the prefix, and the same row switches from `none` to the prefix at that step. Drop-off before registration cannot be split by country: every row that stopped before `registered` sits in the `none` group.
- **`phoneSubmitted` means the SMS code request succeeded.** `initPhoneVerificationAtom` reports it after `initPhoneVerification` returns. A person who leaves on the phone screen, or whose code request failed, stays at `opened`.
- **`registeredAfter` and the retention windows are clipped by the lifetime.** The journey lives 37 days from first open. A registration later than that writes nothing, and a `coreActionD30` window that ends after the lifetime stays absent and reads as `unknown`.

## 7. Dashboard rules

- **Population label**: every chart states its population. Client rows are labelled "Installs with analytics on" (reporting instances on a release line that ships the definition), never "users". Backend counts are labelled "All users", shown next to client numbers and never combined with them in one ratio.
- **Small-group suppression**: any group (cohort week, platform, release line, state value) with fewer than 20 reporting instances (placeholder, tunable) is hidden or merged into "other". Country is the dimension most likely to trip this; small countries roll up into a region or "other". Applied after filtering, so drilling down cannot reveal a suppressed group.
- **Maturity**: journey cohorts are shown only after `lifetimeDays + graceDays` since the cohort's last possible `startDay`; aggregation buckets only after `bucketEndDay + settleDays`. Immature buckets are drawn as provisional or not at all. Both derive from `analyticsStateMaxAgeDays(definition, defaultAnalyticsWindow)`, the same rule the server uses to reject stale uploads.
- **Outcome categories**: terminal states, `open` (still within lifetime), `unknown` (lifetime elapsed without terminal step). Never label `unknown` as churn.
- **Empty-marketplace rate**: `activityWeekly` rows with `offersVisible = 0` divided by rows with `offersVisible` present. Rows without it never loaded the marketplace that week and are shown as their own count. When suppression pooled the `0` group, the rate is shown as `n/a`.
- **Read path**: the admin-only `/analytics` page of `apps/backoffice-app` reads the metrics database over a separate read-only connection (`METRICS_DB_HOST`, `METRICS_DB_PORT`, `METRICS_DB_USER`, `METRICS_DB_PASSWORD`, `METRICS_DB_NAME`). Queries live in `apps/backoffice-app/src/server/analytics/`: one SQL statement per definition counts payload values per bucket and country, and the query layer applies suppression, maturity and outcome categories before anything leaves the server.
- **Backend metrics**: the same connection reads the `metrics` table, which sits in the same database. Counters are summed per bucket, gauges (and `MEDIAN_OFFER_VISIBILITY_PER_COUNTRY`, an Increment reported as a gauge) take the last report in the bucket, grouped by the country attribute listed per metric in `definitions.md`. Suppression applies to their country breakdowns too. Queries never group by `clubUUid`, `offerId` or `trackingId`.

## 8. Privacy analysis

Attacker model: full read access to `analytics_states` (dump, backup, or a compromised dashboard credential).

What they learn per row: platform, release line (`YY.M`), phone country prefix (`none` before registration), a definition name, a start day, an update day (week for long journeys), and a small enum or capped-counter state. For live rows, a random id with no meaning outside the device.

What they cannot learn:

- Who the instance is: no phone number, no hash, no IP, no device model, no installation id, no session token. Country prefix is the only demographic column.
- When exactly anything happened: day or week granularity only; the only sub-day information is the upload itself, which is not stored.
- Whether two rows belong to the same device: ids are independent random values per instance and per bucket, and the row attributes are limited to platform, release line and country prefix. For large countries that is a group of thousands; for small countries it is not, which is why suppression is mandatory on every read path.

Linkability across rows: two rows share nothing but `(app_platform, app_major_version, country_prefix, start_day)`. In a small population (a new release line on its first day, a small country) that tuple can be a group of one; the suppression rule in section 7 hides it on dashboards, but the raw table still holds it. Mitigation is population size, not schema; do not add dimensions.

Timing joins with backend rows: backend metrics (`USER_LOGGED_IN`, `OFFER_CREATED`, `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS`) carry exact timestamps and country. Journey steps are uploaded as they happen, so an `onboarding` row is written within seconds of the `USER_LOGGED_IN` metric row, and an attacker with the database could in principle pair the two through Postgres write order (`xmin`, the `pk` sequence, backups taken at known times) or through arrival time (the relay hides the IP, not the time). The accepted mitigations: `analytics_states` has no timestamp column, so write order must be reconstructed from side channels instead of read from the row; the relay (section 4.5) keeps the IP away from Vexl; and a successful pair yields only what the metric row already knows (country, exact time) plus the journey state, never a new identifier. This trade-off was taken deliberately: delaying the first upload to the next app start made a user who churns in their first session invisible, which defeats the purpose of journeys.

Clubs: no row carries a club id. Club activity is a boolean or a membership count bucket on rows that also carry country, so a row says "this install uses some Club", never which one.

Weekly tenure: `activityWeekly.tenure` names the registration week for `w0`, `w1`, `w4` and `w13`, so weekly rows of one registration cohort can be grouped across weeks. In a small country that cohort may be a handful of installs. Accepted as the price of week-13 retention without an id; the other weeks are pooled and suppression applies (`definitions.md`).

Long-lived journeys are the most linkable objects in the system because a random id lives for up to 37 days; they carry booleans and enums only, one journey per milestone, never chained.

Endpoint abuse: anyone can send junk through a relay. Schema validation, caps, the body limit and the per-relay rate limit bound the damage to noise, and the dashboard's suppression and maturity rules bound the effect of a burst. Nothing in the payload can point at another user's data.

Rate limiter: the shared limiter logs the connecting IP and keeps per-IP request times in Redis. For this endpoint that IP is always a relay's, so neither holds a client IP.

Country on onboarding rows: a row that never reached `registered` has `country_prefix = none` (section 6.8), so the pre-registration part of the funnel reveals no country at all.

## 9. Work items

In dependency order. Each item ends with the verification steps from `AGENTS.md`.

**packages/analytics-definitions**

- [x] Scaffold package (mirror `packages/generic-utils/package.json`, depend on `effect` only).
- [x] `buckets.ts` (`dayOf`, `isoWeekStart`, duration, days and offers-visible buckets, `cappedCounter`) with tests around year boundaries and cap edges.
- [x] `defineJourney`, `defineAggregation`, `registry.ts`, `decodeAnalyticsPayload`.
- [x] `coreAction.ts` with the main / Club rules from `definitions.md`.
- [x] `'day'` in `AggregationPeriod` (`core.ts`) for `activityDaily`, and the new buckets (section 5).
- [x] Add the definitions in `definitions.md` to the registry.

**packages/rest-api**

- [x] `AnalyticsStateUpsert` body schema (in the definitions package) and `InvalidAnalyticsStateError` in `services/metrics/contracts.ts`.
- [x] `POST /analytics/ohttp` gateway endpoint in `services/metrics/specification.ts` with the relay token header, `MaxExpectedDailyCall`, 400/403/503 errors, plus `RelayedAnalyticsState` and its padded encoding in `contracts.ts`. 413 comes from the body size cap in the server.
- [x] `analytics-relays.json` (relay URLs and gateway key config per environment), fetched by the app.

**apps/metrics-service**

- [x] Migration `0004_add_analytics_states_table.ts`, registered in `db/layer.ts`.
- [x] `MetricsDbService` queries: `upsertAnalyticsState`, `expireAnalyticsStateIds`, `deleteExpiredAnalyticsStates`.
- [x] Route handler: body size guard, registry lookup, `Schema.decodeUnknown` with excess property error, staleness check, extraction of platform and release line only.
- [x] Daily expiry and retention task via `makeRepeatingTaskLayer` (`analyticsExpiryWorker.ts`).
- [x] Config: `ANALYTICS_GRACE_DAYS`, `ANALYTICS_SETTLE_DAYS`, `ANALYTICS_RETENTION_DAYS`, `ANALYTICS_EXPIRY_CRON`.
- [x] Add a pointer to this document in `docs/backend_stats.md`.
- [x] OHTTP gateway: decapsulation, relay token check, key and token config.
- [x] Handler tests (`src/__tests__/routes/relayAnalyticsState.test.ts`) and expiry job test, on the jest harness added to the service.

**apps/mobile**

- [x] `analyticsEnabled` in `preferencesAtom` and the Settings toggle (follow `docs/ui_coding_guideline.md`).
- [x] Markers and instances atoms with `atomWithParsedMmkvStorageWithImmediateSaveOption` (section 6.2).
- [x] `apps/mobile/src/utils/analytics/` module (section 6.3) with unit tests for the pure rules and the flush outcomes.
- [x] Start flush as an in-app loading task (`runOn: 'start'`, `requiresUserLoggedIn: false`); background flush via `useAppState` in `App.tsx`.
- [x] `instances.ts` uses `bucketStartDay` from `buckets.ts`, which handles the `'day'` period.
- [x] Markers listed in section 6.2 (including `lastForegroundAt`, set only on AppState `active`) and one report atom per definition.
- [x] Data tag on the inactivity reminder local notification (`userInactivity.ts`), so its opens are `inactivityReminder`, not `other`.
- [x] Signal sites per field in `definitions.md`.
- [x] Verify logout path leaves nothing behind (test in `analytics.test.ts`; the pre-login clear in `Intro1Screen` keeps analytics on purpose).

**backend metrics**

- [x] Send-task-type attribute on `NOTIFICATION_SENT` (`definitions.md`).
- [x] `TRADE_FEEDBACK_SUBMITTED` from feedback-service.

**apps/backoffice-app**

- [x] Read-only metrics database connection and query helpers.
- [x] Suppression, maturity and population labelling as shared helpers used by every analytics chart.
- [x] One query per client definition and per backend metric (section 7).
- [x] Seven views in `metrics.md` (`src/components/analytics/`).
- [x] Local seed of fake states and metrics: `pnpm dev:seed-analytics` (`tooling/dev/seed-analytics.ts`, localhost only).
- [x] Wire the seven views to the queries.

**infrastructure (separate repo)**

- [ ] Independent relay operators for production (section 4.5) and a staging relay; then add them to `analytics-relays.json`.
- [ ] metrics-service env: `ANALYTICS_OHTTP_GATEWAY_SECRETS`, `ANALYTICS_RELAY_TOKENS`.
- [ ] Rate limit values and body size cap in the environment.
- [ ] feedback-service env: `METRICS_QUEUE_NAME` (it now reports `TRADE_FEEDBACK_SUBMITTED` and does not start without it).
- [ ] Database role for the dashboard read path: a read-only role on the metrics database, wired into the backoffice deployment as `METRICS_DB_HOST`, `METRICS_DB_PORT`, `METRICS_DB_USER`, `METRICS_DB_PASSWORD`, `METRICS_DB_NAME`.

## 10. Decisions made in this document

Recorded so they are not re-litigated in review:

- Journeys store both `startDay` and `updatedDay`; long journeys round `updatedDay` to week, and the client never sends an `updatedDay` earlier than `startDay`. In the journey's first week both are the same day, which the server already holds, so the clamp reveals nothing new.
- `revision` (client counter per id) resolves retry ordering; there is no server-side timestamp.
- Buckets are UTC.
- `app_major_version` stores the CalVer release line `YY.M`.
- Rejected payloads are dropped, not dead-lettered.
- Journey steps are uploaded right away, without the pending aggregation buckets; aggregations are flushed on app start and best effort on background. The first upload of a journey can be paired by write order with the backend row of the same action; this trade-off is accepted and analysed in section 8.
- Analytics is opt-in: off by default, leaving the first screen with it on starts the onboarding journey, and turning it off wipes local analytics state.
- Country prefix is stored on all rows (journeys and aggregations), except definitions marked `storeCountry: false`. Small-group suppression on the dashboard is the mitigation.
- Active instances come from three activity aggregations (day, week, month), because unique counts cannot be summed across unlinkable rows. Totals are summed from day rows.
- "Before churn" snapshots ("Marketplace actions before churn", "Chats opened before churn", "App sessions before churn") are rejected: a per-device record overwritten on every start is a standing device profile.
- Foreground session tracking is not built.
- City is not collected.
- No journey lives longer than 37 days. Week-13 retention comes from the device-computed `tenure` on `activityWeekly`, not from a longer journey.
- Dormancy is detected on the device when the app comes to the foreground 30 days after the last foreground (`lastForegroundAt`). There is no background task for it.

## 11. Open questions

None at the system level. Business feedback on the decisions goes to `metrics.md`.
