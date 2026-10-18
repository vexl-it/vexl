/**
 * seed-analytics.ts — fills a LOCAL metrics database with about 18 months of
 * fake data for the backoffice analytics dashboard (/analytics).
 *
 * - `analytics_states`: rows of every client definition in
 *   packages/analytics-definitions, each payload validated with the
 *   definition's schema, journeys starting on any day and aggregations on the
 *   first day of their bucket. Ids of rows past their maximum age are null,
 *   as the expiry job leaves them.
 * - `metrics`: the backend metrics the dashboard reads (docs/analytics/
 *   definitions.md, "Backend metrics"). Counters are written as one row per
 *   day and attribute combination with the day's count as value.
 *
 * Both tables are emptied of what the script writes first, so it can be
 * re-run. The tables must exist: start metrics-service once (`pnpm
 * dev:backend`), which runs its migrations.
 *
 * USAGE (from the repo root):
 *
 *   pnpm dev:seed-analytics
 *
 * Env: METRICS_DB_HOST / METRICS_DB_PORT / METRICS_DB_USER /
 * METRICS_DB_PASSWORD / METRICS_DB_NAME (defaults: the local dev Postgres and
 * its `metrics` database), SEED_SCALE (default 1, multiplies every volume).
 * Refuses to run unless METRICS_DB_HOST is local.
 */
import {PgClient} from '@effect/sql-pg'
import {
  bucketStartDay,
  dayOf,
  updatedDayFor,
  type AfterOpenAction,
  type ClubCountBucket,
  type DaysBucket,
  type DormancyBucket,
  type DurationBucket,
  type NotificationCategory,
  type OffersVisibleBucket,
  type RequestCountBucket,
  type TenureBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  analyticsStateMaxAgeDays,
  defaultAnalyticsWindow,
  type AggregationPeriod,
  type AnalyticsRetentionShape,
  type UpdatedDayPrecision,
} from '@vexl-next/analytics-definitions/src/core'
import {activityDailyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityDaily'
import {activityMonthlyAggregation} from '@vexl-next/analytics-definitions/src/definitions/activityMonthly'
import {
  activityWeeklyAggregation,
  type ActivityWeeklyState,
} from '@vexl-next/analytics-definitions/src/definitions/activityWeekly'
import {
  notificationOpenJourney,
  type NotificationOpenState,
} from '@vexl-next/analytics-definitions/src/definitions/notificationOpen'
import {
  offerJourney,
  type OfferState,
} from '@vexl-next/analytics-definitions/src/definitions/offer'
import {
  onboardingJourney,
  type ActivationKind,
  type ContactsImportOutcome,
  type OnboardingState,
} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {
  promptJourney,
  type PromptId,
} from '@vexl-next/analytics-definitions/src/definitions/prompt'
import {
  reactivationJourney,
  type ReactivationSource,
} from '@vexl-next/analytics-definitions/src/definitions/reactivation'
import {
  requestJourney,
  type RequestOutcome,
  type RequestState,
} from '@vexl-next/analytics-definitions/src/definitions/request'
import {
  Array,
  Effect,
  Layer,
  Number,
  Option,
  pipe,
  Record,
  Redacted,
  Schema,
  String,
} from 'effect'
import {randomUUID} from 'node:crypto'
import devConfig from '../../dev.config'
import {resolvePorts} from './ports'
import {loadRawEnvLocal} from './secrets'

// --- config and local-only guard ---------------------------------------------

const env = process.env
const dbConfig = {
  host: env.METRICS_DB_HOST ?? devConfig.infra.host,
  port: Number.parse(env.METRICS_DB_PORT ?? '').pipe(
    Option.getOrElse(
      () => resolvePorts(devConfig.ports, loadRawEnvLocal()).postgres
    )
  ),
  username: env.METRICS_DB_USER ?? devConfig.infra.postgres.user,
  password: Redacted.make(
    env.METRICS_DB_PASSWORD ?? devConfig.infra.postgres.password
  ),
  database: env.METRICS_DB_NAME ?? devConfig.dbNames.metrics,
}
const SCALE = Number.parse(env.SEED_SCALE ?? '1').pipe(
  Option.getOrElse(() => 1)
)

const isLocalHost = (host: string): boolean =>
  host === 'localhost' ||
  host.endsWith('.localhost') ||
  host === '127.0.0.1' ||
  host === '::1'

if (!isLocalHost(dbConfig.host)) {
  console.error(
    `Refusing to run: METRICS_DB_HOST is "${dbConfig.host}". This script ` +
      'deletes and writes analytics data and may only target a local database.'
  )
  process.exit(1)
}

// --- randomness and time -------------------------------------------------------

// mulberry32, seeded, so every run produces the same shapes
const random = ((): (() => number) => {
  let state = 0x5eed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
})()

const chance = (probability: number): boolean => random() < probability

const between = (min: number, max: number): number =>
  min + Math.floor(random() * (max - min + 1))

const pick = <T>(weighted: ReadonlyArray<readonly [T, number]>): T => {
  const total = Array.reduce(weighted, 0, (sum, [, weight]) => sum + weight)
  let left = random() * total
  for (const [value, weight] of weighted) {
    left -= weight
    if (left < 0) return value
  }
  return weighted[weighted.length - 1][0]
}

// A count around `mean`, so the lines are not flat; fractions round up by
// chance, so small means still produce rows
const around = (mean: number): number => {
  const value = Math.max(0, mean * SCALE * (0.85 + random() * 0.3))
  return Math.floor(value) + (chance(value % 1) ? 1 : 0)
}

// Array.makeBy always makes at least one element
const times = <A>(count: number, make: () => A): A[] =>
  count < 1 ? [] : Array.makeBy(count, make)

const DAY_MS = 24 * 60 * 60 * 1000
const RETENTION_DAYS = 540
const now = new Date()
const TODAY_MS = Date.UTC(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate()
)
const FIRST_DAY_MS = TODAY_MS - (RETENTION_DAYS - 1) * DAY_MS
const DAYS = Array.makeBy(
  RETENTION_DAYS,
  (index) => FIRST_DAY_MS + index * DAY_MS
)

// Slow growth over the 18 months
const trend = (dayMs: number): number =>
  0.85 + (0.3 * (dayMs - FIRST_DAY_MS)) / (RETENTION_DAYS * DAY_MS)

// --- population -----------------------------------------------------------------

interface Country {
  readonly prefix: number
  readonly share: number
  // Share of installs whose marketplace shows no main offers
  readonly empty: number
  readonly medianReach: number
}

const COUNTRIES: readonly Country[] = [
  {prefix: 420, share: 0.4, empty: 0.3, medianReach: 84},
  {prefix: 421, share: 0.13, empty: 0.48, medianReach: 61},
  {prefix: 49, share: 0.14, empty: 0.62, medianReach: 47},
  {prefix: 43, share: 0.07, empty: 0.66, medianReach: 39},
  {prefix: 48, share: 0.06, empty: 0.71, medianReach: 31},
  {prefix: 41, share: 0.012, empty: 0.82, medianReach: 24},
  {prefix: 36, share: 0.04, empty: 0.78, medianReach: 18},
  {prefix: 44, share: 0.04, empty: 0.8, medianReach: 15},
  {prefix: 1, share: 0.035, empty: 0.85, medianReach: 12},
  {prefix: 34, share: 0.03, empty: 0.8, medianReach: 14},
  {prefix: 33, share: 0.025, empty: 0.82, medianReach: 11},
  {prefix: 39, share: 0.018, empty: 0.84, medianReach: 9},
]

const PLATFORMS: ReadonlyArray<readonly [string, number]> = [
  ['IOS', 0.42],
  ['ANDROID', 0.58],
]

const pickCountry = (): Country =>
  pick(
    Array.map(COUNTRIES, (country): readonly [Country, number] => [
      country,
      country.share,
    ])
  )

interface Install {
  readonly country: Country
  readonly platform: string
}

const randomInstall = (): Install => ({
  country: pickCountry(),
  platform: pick(PLATFORMS),
})

// Release line YY.M, a few weeks behind the day
const releaseLine = (dayMs: number): string => {
  const release = new Date(dayMs - 20 * DAY_MS)
  return `${release.getUTCFullYear() % 100}.${release.getUTCMonth() + 1}`
}

// --- analytics_states rows -----------------------------------------------------

// Not interfaces: `sql.insert` wants records, which interfaces are not
type StateRow = Readonly<{
  id: string | null
  kind: string
  name: string
  schemaVersion: number
  revision: number
  startDay: string
  updatedDay: string
  payload: string
  appPlatform: string
  appMajorVersion: string
  countryPrefix: string
}>

interface Definition<A> {
  readonly name: string
  readonly schemaVersion: number
  readonly payloadSchema: Schema.Schema<A, A>
}

// metrics-service stores payloads through a client that turns JSON keys into
// snake_case, so the seed does the same
const storedPayload = <A>(definition: Definition<A>, payload: A): string =>
  JSON.stringify(
    Record.mapKeys(
      Schema.decodeUnknownSync(
        Schema.Record({key: Schema.String, value: Schema.Unknown})
      )(
        Schema.decodeUnknownSync(definition.payloadSchema, {
          onExcessProperty: 'error',
        })(payload)
      ),
      String.camelToSnake
    )
  )

const isExpired = (shape: AnalyticsRetentionShape, startMs: number): boolean =>
  (TODAY_MS - startMs) / DAY_MS >
  analyticsStateMaxAgeDays(shape, defaultAnalyticsWindow)

// A journey's field set on `dayMs`: only fields whose day has come are kept
interface Timed<A> {
  readonly field: Partial<A>
  readonly dayMs: number
}

const journeyRow = <A>(
  definition: Definition<A> & {
    readonly lifetimeDays: number
    readonly updatedDayPrecision: UpdatedDayPrecision
  },
  install: Install,
  startMs: number,
  initial: A,
  events: ReadonlyArray<Timed<A>>,
  {countryKnown = true}: {countryKnown?: boolean} = {}
): StateRow => {
  const lastDayMs = Math.min(
    TODAY_MS,
    startMs + (definition.lifetimeDays - 1) * DAY_MS
  )
  const happened = Array.filter(events, (event) => event.dayMs <= lastDayMs)
  const startDay = dayOf(new Date(startMs))
  return {
    id: isExpired({kind: 'journey', ...definition}, startMs)
      ? null
      : randomUUID(),
    kind: 'journey',
    name: definition.name,
    schemaVersion: definition.schemaVersion,
    revision: happened.length,
    startDay,
    updatedDay: updatedDayFor(
      definition.updatedDayPrecision,
      startDay,
      new Date(
        Array.reduce(happened, startMs, (latest, event) =>
          Math.max(latest, event.dayMs)
        )
      )
    ),
    payload: storedPayload(
      definition,
      Array.reduce(happened, initial, (state, event) => ({
        ...state,
        ...event.field,
      }))
    ),
    appPlatform: install.platform,
    appMajorVersion: releaseLine(startMs),
    countryPrefix: countryKnown ? `${install.country.prefix}` : 'none',
  }
}

const aggregationRow = <A>(
  definition: Definition<A> & {readonly period: AggregationPeriod},
  install: Install,
  startMs: number,
  payload: A
): StateRow => {
  const startDay = bucketStartDay(definition.period, new Date(startMs))
  const bucketStartMs = Date.parse(startDay)
  const lastDayMs = Math.min(
    TODAY_MS,
    definition.period === 'day'
      ? bucketStartMs
      : definition.period === 'week'
        ? bucketStartMs + 6 * DAY_MS
        : Date.UTC(
            new Date(bucketStartMs).getUTCFullYear(),
            new Date(bucketStartMs).getUTCMonth() + 1
          ) - DAY_MS
  )
  return {
    id: isExpired({kind: 'aggregation', ...definition}, bucketStartMs)
      ? null
      : randomUUID(),
    kind: 'aggregation',
    name: definition.name,
    schemaVersion: definition.schemaVersion,
    revision: between(1, 30),
    startDay,
    updatedDay: dayOf(
      new Date(between(bucketStartMs / DAY_MS, lastDayMs / DAY_MS) * DAY_MS)
    ),
    payload: storedPayload(definition, payload),
    appPlatform: install.platform,
    appMajorVersion: releaseLine(bucketStartMs),
    countryPrefix: `${install.country.prefix}`,
  }
}

const dayAfter = (startMs: number, days: number): number =>
  startMs + days * DAY_MS

// --- onboarding ------------------------------------------------------------------

const daysAfter = (bucket: DaysBucket, max: number): number => {
  if (bucket === 'd0') return 0
  if (bucket === 'd1') return 1
  if (bucket === 'd2To7') return between(2, 7)
  return between(8, max)
}

const offersVisibleFor = (
  country: Country,
  emptyBoost = 0
): OffersVisibleBucket =>
  chance(Math.min(1, country.empty + emptyBoost))
    ? '0'
    : pick<OffersVisibleBucket>([
        ['1to5', 0.35],
        ['6to20', 0.35],
        ['21to50', 0.2],
        ['51plus', 0.1],
      ])

const ACTIVATION_BY_OFFERS: Record<OffersVisibleBucket, number> = {
  '0': 0.03,
  '1to5': 0.14,
  '6to20': 0.28,
  '21to50': 0.4,
  '51plus': 0.5,
}

interface Registration {
  readonly install: Install
  readonly dayMs: number
  readonly joinedClub: boolean
}

const onboarding = (
  startMs: number
): {row: StateRow; registration: Option.Option<Registration>} => {
  const install = randomInstall()
  const events: Array<Timed<OnboardingState>> = []
  const at = (dayMs: number, field: Partial<OnboardingState>): void => {
    events.push({dayMs, field})
  }
  const lifetimeEnd = dayAfter(startMs, onboardingJourney.lifetimeDays - 1)

  if (!chance(0.78)) {
    return {
      row: journeyRow(
        onboardingJourney,
        install,
        startMs,
        {step: 'opened'},
        [],
        {
          countryKnown: false,
        }
      ),
      registration: Option.none(),
    }
  }
  at(startMs, {step: 'phoneSubmitted'})
  if (!chance(0.744)) {
    return {
      row: journeyRow(
        onboardingJourney,
        install,
        startMs,
        {step: 'opened'},
        events,
        {countryKnown: false}
      ),
      registration: Option.none(),
    }
  }
  at(startMs, {step: 'codeVerified'})
  const existingAccount = chance(0.12)
  if (existingAccount || !chance(0.948)) {
    if (existingAccount) at(startMs, {existingAccount: true})
    return {
      row: journeyRow(
        onboardingJourney,
        install,
        startMs,
        {step: 'opened'},
        events,
        {countryKnown: false}
      ),
      registration: Option.none(),
    }
  }

  const registeredAfter = pick<DaysBucket>([
    ['d0', 0.71],
    ['d1', 0.09],
    ['d2To7', 0.12],
    ['d8Plus', 0.08],
  ])
  const registrationDayIndex = daysAfter(registeredAfter, 36)
  const registeredMs = dayAfter(startMs, registrationDayIndex)
  at(registeredMs, {step: 'registered', registeredAfter})

  const clubJoin = pick<'before' | 'after' | 'none'>([
    ['before', 0.18],
    ['after', 0.12],
    ['none', 0.7],
  ])
  if (clubJoin === 'before')
    at(registeredMs, {clubJoin: 'beforeContactsImport'})

  const contactsImport = pick<ContactsImportOutcome | 'never'>([
    ['completed', 0.8],
    ['skipped', 0.07],
    ['denied', 0.05],
    ['failed', 0.01],
    ['started', 0.03],
    ['never', 0.04],
  ])
  if (contactsImport !== 'never') at(registeredMs, {contactsImport})
  if (clubJoin === 'after' && contactsImport === 'completed')
    at(dayAfter(registeredMs, between(0, 10)), {
      clubJoin: 'afterContactsImport',
    })

  const loaded = chance(contactsImport === 'completed' ? 0.9 : 0.4)
  const firstMarketplaceLoad = loaded
    ? offersVisibleFor(
        install.country,
        contactsImport === 'completed' ? 0 : 0.3
      )
    : undefined
  if (firstMarketplaceLoad !== undefined) {
    at(registeredMs, {firstMarketplaceLoad})
    if (firstMarketplaceLoad !== '0' && chance(0.6))
      at(dayAfter(registeredMs, between(0, 3)), {offerOpened: true})
  }

  const activated = chance(
    firstMarketplaceLoad === undefined
      ? 0.02
      : ACTIVATION_BY_OFFERS[firstMarketplaceLoad]
  )
  const activatedAfter = pick<DaysBucket>([
    ['d0', 0.38],
    ['d1', 0.14],
    ['d2To7', 0.22],
    ['d8Plus', 0.26],
  ])
  const activationMs = dayAfter(registeredMs, daysAfter(activatedAfter, 30))
  if (activated && activationMs <= lifetimeEnd)
    at(activationMs, {
      activation: pick<ActivationKind>([
        ['offer', 0.4],
        ['request', 0.6],
      ]),
      activatedAfter,
    })
  if (clubJoin !== 'none' && chance(clubJoin === 'before' ? 0.15 : 0.1))
    at(dayAfter(registeredMs, between(0, 20)), {
      clubActivation: pick<ActivationKind>([
        ['offer', 0.3],
        ['request', 0.7],
      ]),
    })

  const lift =
    (activated && activatedAfter === 'd0' ? 2.6 : activated ? 1.5 : 0.6) *
    (clubJoin === 'before' ? 1.2 : 1)
  if (chance(Math.min(0.95, 0.25 * lift)))
    at(dayAfter(registeredMs, 1), {coreActionD1: true})
  if (chance(Math.min(0.95, 0.17 * lift)))
    at(dayAfter(registeredMs, between(7, 13)), {coreActionD7: true})
  // The D30 window fits the 37-day journey only for early registrations
  if (registrationDayIndex <= 2 && chance(Math.min(0.95, 0.12 * lift)))
    at(dayAfter(registeredMs, between(28, 34)), {coreActionD30: true})

  return {
    row: journeyRow(
      onboardingJourney,
      install,
      startMs,
      {step: 'opened'},
      events,
      {countryKnown: registeredMs <= TODAY_MS}
    ),
    registration:
      registeredMs <= TODAY_MS
        ? Option.some({
            install,
            dayMs: registeredMs,
            joinedClub: clubJoin !== 'none',
          })
        : Option.none(),
  }
}

// --- other journeys ------------------------------------------------------------

const DURATION_OFFSETS: Record<DurationBucket, () => number> = {
  under1h: () => 0,
  '1hTo1d': () => between(0, 1),
  '1dTo7d': () => between(1, 7),
  over7d: () => between(7, 29),
}

const offer = (startMs: number): StateRow => {
  const install = randomInstall()
  const offerClass = chance(0.25) ? 'mainAndClub' : 'main'
  const initial: OfferState = {
    offerType: chance(0.6) ? 'buy' : 'sell',
    class: offerClass,
  }
  const events: Array<Timed<OfferState>> = []
  const firstRequest = pick<DurationBucket | 'none'>(
    offerClass === 'main'
      ? [
          ['under1h', 0.07],
          ['1hTo1d', 0.13],
          ['1dTo7d', 0.15],
          ['over7d', 0.1],
          ['none', 0.55],
        ]
      : [
          ['under1h', 0.12],
          ['1hTo1d', 0.18],
          ['1dTo7d', 0.18],
          ['over7d', 0.09],
          ['none', 0.43],
        ]
  )
  const removedMs = chance(0.15) ? dayAfter(startMs, between(0, 29)) : Infinity
  if (removedMs !== Infinity)
    events.push({dayMs: removedMs, field: {removed: true}})
  if (firstRequest !== 'none') {
    const requestMs = dayAfter(startMs, DURATION_OFFSETS[firstRequest]())
    if (requestMs < removedMs) {
      events.push({
        dayMs: requestMs,
        field: {
          firstRequestAfter: firstRequest,
          requestsReceived: pick<RequestCountBucket>([
            ['1', 0.5],
            ['2to5', 0.4],
            ['6plus', 0.1],
          ]),
        },
      })
      if (chance(0.7)) {
        const answer = pick<DurationBucket>([
          ['under1h', 0.3],
          ['1hTo1d', 0.4],
          ['1dTo7d', 0.25],
          ['over7d', 0.05],
        ])
        events.push({
          dayMs: requestMs + DURATION_OFFSETS[answer]() * DAY_MS,
          field: {firstAnswerAfter: answer},
        })
      }
    }
  }
  return journeyRow(offerJourney, install, startMs, initial, events)
}

const request = (startMs: number): StateRow => {
  const install = randomInstall()
  const requestClass = chance(0.3) ? 'club' : 'main'
  const initial: RequestState = {class: requestClass}
  const events: Array<Timed<RequestState>> = []
  const outcome = pick<RequestOutcome | 'none'>([
    ['approved', requestClass === 'main' ? 0.44 : 0.52],
    ['rejected', 0.13],
    ['cancelled', 0.05],
    ['none', requestClass === 'main' ? 0.38 : 0.3],
  ])
  if (outcome === 'cancelled')
    events.push({dayMs: dayAfter(startMs, between(0, 13)), field: {outcome}})
  if (outcome === 'approved' || outcome === 'rejected') {
    const answerAfter = pick<DurationBucket>(
      requestClass === 'main'
        ? [
            ['under1h', 24],
            ['1hTo1d', 22],
            ['1dTo7d', 12],
            ['over7d', 3],
          ]
        : [
            ['under1h', 31],
            ['1hTo1d', 24],
            ['1dTo7d', 10],
            ['over7d', 2],
          ]
    )
    const answerMs = dayAfter(
      startMs,
      answerAfter === 'over7d'
        ? between(7, 13)
        : DURATION_OFFSETS[answerAfter]()
    )
    events.push({dayMs: answerMs, field: {outcome, answerAfter}})
    if (outcome === 'approved' && chance(0.68))
      events.push({
        dayMs: dayAfter(answerMs, between(0, 2)),
        field: {bothWrote: true},
      })
  }
  return journeyRow(requestJourney, install, startMs, initial, events)
}

// [source, share of returns, core action within 7 days]
const RETURN_SOURCES: ReadonlyArray<
  readonly [ReactivationSource, number, number]
> = [
  ['direct', 0.64, 0.24],
  ['inactivityReminder', 0.12, 0.18],
  ['chatMessage', 0.07, 0.46],
  ['requestReceived', 0.03, 0.52],
  ['requestAnswered', 0.015, 0.49],
  ['tradeReminder', 0.005, 0.3],
  ['newOffers', 0.05, 0.27],
  ['marketplaceReady', 0.01, 0.31],
  ['clubAdmission', 0.01, 0.38],
  ['clubDeactivated', 0.002, 0.1],
  ['productNews', 0.03, 0.15],
  ['other', 0.018, 0.2],
]

const reactivation = (startMs: number): StateRow => {
  const install = randomInstall()
  const [openedFrom, , coreRate] = pick(
    Array.map(
      RETURN_SOURCES,
      (source): readonly [(typeof RETURN_SOURCES)[number], number] => [
        source,
        source[1],
      ]
    )
  )
  const clubMember = chance(0.27)
  const firstAction = pick<AfterOpenAction | 'none'>([
    ['none', 0.61],
    ['offerOpened', 0.22],
    ['requestSent', 0.09],
    ['offerCreated', 0.05],
    ['chatOpened', 0.03],
  ])
  const events: Array<Timed<typeof reactivationJourney.payloadSchema.Type>> = [
    ...(clubMember ? [{dayMs: startMs, field: {clubMember: true}}] : []),
    ...(firstAction === 'none'
      ? []
      : [{dayMs: dayAfter(startMs, between(0, 2)), field: {firstAction}}]),
    ...(chance(Math.min(0.9, coreRate * (clubMember ? 1.4 : 0.9)))
      ? [{dayMs: dayAfter(startMs, between(0, 6)), field: {coreAction: true}}]
      : []),
  ]
  return journeyRow(
    reactivationJourney,
    install,
    startMs,
    {
      dormantFor: pick<DormancyBucket>([
        ['d30To60', 0.52],
        ['d61To180', 0.31],
        ['over180', 0.17],
      ]),
      openedFrom,
    },
    events
  )
}

// [category, opens per week, offer opened, offer created, request sent, chat opened]
const OPENS: ReadonlyArray<
  readonly [NotificationCategory, number, number, number, number, number]
> = [
  ['newOffers', 1500, 0.41, 0.03, 0.09, 0.05],
  ['marketplaceReady', 520, 0.36, 0.06, 0.08, 0.02],
  ['inactivityReminder', 700, 0.22, 0.03, 0.05, 0.06],
  ['productNews', 310, 0.18, 0.02, 0.03, 0.01],
  ['clubAdmission', 140, 0.32, 0.05, 0.07, 0.03],
  ['clubDeactivated', 25, 0.1, 0.02, 0.02, 0.01],
  ['chatMessage', 9400, 0.12, 0.02, 0.04, 0.95],
  ['requestReceived', 2300, 0.18, 0.02, 0.03, 0.9],
  ['requestAnswered', 1900, 0.09, 0.01, 0.05, 0.9],
  ['tradeReminder', 640, 0.04, 0.01, 0.02, 0.85],
  ['other', 420, 0.15, 0.02, 0.03, 0.05],
]
// Opens are the most numerous journey; a fraction keeps the seed quick
const OPENS_FRACTION = 1 / 15

const notificationOpens = (dayMs: number): readonly StateRow[] =>
  Array.flatMap(OPENS, ([category, weekly, ...rates]) =>
    times(around((weekly * OPENS_FRACTION) / 7), () => {
      const [offerOpened, offerCreated, requestSent, chatOpened] = Array.map(
        rates,
        chance
      )
      const state: NotificationOpenState = {
        category,
        ...(offerOpened ? {offerOpened} : {}),
        ...(offerCreated ? {offerCreated} : {}),
        ...(requestSent ? {requestSent} : {}),
        ...(chatOpened ? {chatOpened} : {}),
      }
      return journeyRow(
        notificationOpenJourney,
        randomInstall(),
        dayMs,
        {category},
        [{dayMs, field: state}]
      )
    })
  )

// [prompt, shown per week, dismissed, tapped, target reached]
const PROMPTS: ReadonlyArray<
  readonly [PromptId, number, number, number, number]
> = [
  ['importContacts', 130, 0.64, 0.36, 0.19],
  ['importNewContacts', 220, 0.7, 0.3, 0.17],
  ['missingProductCategories', 90, 0.75, 0.25, 0.14],
  ['enableNotifications', 110, 0.58, 0.42, 0.31],
  ['enableBackgroundRefresh', 60, 0.66, 0.34, 0.22],
  ['createOffer', 170, 0.71, 0.29, 0.06],
]

const prompts = (dayMs: number): readonly StateRow[] =>
  Array.flatMap(PROMPTS, ([promptId, weekly, dismissed, tapped, reached]) =>
    times(around(weekly / 7), () => {
      const outcome = pick<'dismissed' | 'tapped' | 'none'>([
        ['dismissed', dismissed * 0.9],
        ['tapped', tapped * 0.9],
        ['none', 0.1],
      ])
      return journeyRow(promptJourney, randomInstall(), dayMs, {promptId}, [
        ...(outcome === 'none'
          ? []
          : [{dayMs: dayAfter(dayMs, between(0, 3)), field: {outcome}}]),
        ...(chance(reached)
          ? [
              {
                dayMs: dayAfter(dayMs, between(0, 6)),
                field: {targetReached: true},
              },
            ]
          : []),
      ])
    })
  )

// --- activity aggregations ----------------------------------------------------

const DAILY_ACTIVE = 1200
const WEEKLY_ACTIVE = 3500
const MONTHLY_ACTIVE = 7000
// The daily view shows at most 90 days, plus the 14-day settle
const DAILY_DAYS = 120

const coreActivity = (
  mainRate: number,
  clubRate: number
): {coreActionMain?: boolean; coreActionClub?: boolean} => ({
  ...(chance(mainRate) ? {coreActionMain: true} : {}),
  ...(chance(clubRate) ? {coreActionClub: true} : {}),
})

const dailyActivity = (dayMs: number): readonly StateRow[] => {
  const weekend = Array.contains([0, 6], new Date(dayMs).getUTCDay())
  return times(around(DAILY_ACTIVE * trend(dayMs) * (weekend ? 0.85 : 1)), () =>
    aggregationRow(
      activityDailyAggregation,
      randomInstall(),
      dayMs,
      coreActivity(0.075, 0.04)
    )
  )
}

const monthlyActivity = (monthMs: number): readonly StateRow[] =>
  times(around(MONTHLY_ACTIVE * trend(monthMs)), () =>
    aggregationRow(
      activityMonthlyAggregation,
      randomInstall(),
      monthMs,
      coreActivity(0.45, 0.18)
    )
  )

// Share of a registration week still opening the app K weeks later
const tenureOf = (weeks: number): Option.Option<[TenureBucket, number]> => {
  if (weeks === 0) return Option.some(['w0', 1])
  if (weeks === 1) return Option.some(['w1', 0.45])
  if (weeks < 4) return Option.some(['w2to3', 0.38])
  if (weeks === 4) return Option.some(['w4', 0.3])
  if (weeks < 13) return Option.some(['w5to12', 0.25])
  if (weeks === 13) return Option.some(['w13', 0.2])
  return Option.none()
}

const MAIN_CORE_RATE: Record<TenureBucket, number> = {
  w0: 0.3,
  w1: 0.4,
  w2to3: 0.35,
  w4: 0.33,
  w5to12: 0.32,
  w13: 0.3,
  w14plus: 0.17,
}

const capped = (value: number, max: number): number => Math.min(max, value)

const weeklyState = (
  install: Install,
  tenure: TenureBucket,
  clubMember: boolean
): ActivityWeeklyState => {
  const clubs: ClubCountBucket = clubMember
    ? pick<ClubCountBucket>([
        ['1', 0.69],
        ['2', 0.2],
        ['3plus', 0.11],
      ])
    : '0'
  const core = coreActivity(
    clubMember ? MAIN_CORE_RATE[tenure] * 0.85 : MAIN_CORE_RATE[tenure],
    clubMember ? 0.45 : 0
  )
  const active = core.coreActionMain === true || core.coreActionClub === true
  const offersCreated = active
    ? pick([
        [0, 0.7],
        [1, 0.25],
        [2, 0.05],
      ])
    : 0
  const requestsApproved = active
    ? pick([
        [0, 0.45],
        [1, 0.35],
        [2, 0.15],
        [4, 0.05],
      ])
    : 0
  const requestsSent = active
    ? Math.max(
        offersCreated + requestsApproved === 0 ? 1 : 0,
        pick([
          [0, 0.25],
          [1, 0.35],
          [2, 0.2],
          [3, 0.1],
          [5, 0.1],
        ])
      )
    : 0
  const offersOpened = capped(Math.floor(-Math.log(1 - random()) * 4.6), 200)
  const counters = {offersCreated, requestsSent, requestsApproved, offersOpened}
  return {
    tenure,
    ...core,
    activeDays: pick([
      [1, 31],
      [2, 19],
      [3, 13],
      [4, 10],
      [5, 8],
      [6, 7],
      [7, 12],
    ]),
    ...Record.filter(counters, (value) => value > 0),
    ...(chance(0.85) ? {offersVisible: offersVisibleFor(install.country)} : {}),
    notificationsAllowed: chance(0.68),
    clubs,
  }
}

const weeklyActivity = (
  registrations: readonly Registration[]
): readonly StateRow[] => {
  const weekOf = (dayMs: number): number =>
    Date.parse(bucketStartDay('week', new Date(dayMs)))
  const firstMondayMs = weekOf(FIRST_DAY_MS + 6 * DAY_MS)
  const weeks = Array.makeBy(
    Math.floor((TODAY_MS - firstMondayMs) / (7 * DAY_MS)) + 1,
    (index) => firstMondayMs + index * 7 * DAY_MS
  )

  // Recent registrations come back in their first 13 weeks…
  const cohortRows = Array.flatMap(registrations, (registration) =>
    Array.filterMap(Array.range(0, 13), (weeksAfter) => {
      const weekMs = weekOf(registration.dayMs) + weeksAfter * 7 * DAY_MS
      return pipe(
        tenureOf(weeksAfter),
        Option.filter(
          ([, share]) =>
            weekMs <= TODAY_MS && weekMs >= firstMondayMs && chance(share)
        ),
        Option.map(([tenure]) => ({
          weekMs,
          row: aggregationRow(
            activityWeeklyAggregation,
            registration.install,
            weekMs,
            weeklyState(
              registration.install,
              tenure,
              registration.joinedClub || chance(0.25)
            )
          ),
        }))
      )
    })
  )
  // …and installs registered earlier fill each week up to its size
  const recentPerWeek = Array.groupBy(cohortRows, ({weekMs}) => `${weekMs}`)
  return [
    ...Array.map(cohortRows, ({row}) => row),
    ...Array.flatMap(weeks, (weekMs) => {
      const recent = recentPerWeek[`${weekMs}`]?.length ?? 0
      return times(
        Math.max(0, around(WEEKLY_ACTIVE * trend(weekMs)) - recent),
        () => {
          const install = randomInstall()
          return aggregationRow(
            activityWeeklyAggregation,
            install,
            weekMs,
            weeklyState(install, 'w14plus', chance(0.39))
          )
        }
      )
    }),
  ]
}

// --- metrics rows --------------------------------------------------------------

type MetricRow = Readonly<{
  uuid: string
  name: string
  value: number
  timestamp: Date
  attributes: string | null
  type: 'Increment' | 'Total'
}>

const metric = (
  name: string,
  type: MetricRow['type'],
  timestampMs: number,
  value: number,
  attributes?: Readonly<Record<string, string | number | boolean>>
): MetricRow => ({
  uuid: randomUUID(),
  name,
  value,
  timestamp: new Date(timestampMs),
  // Stored with snake_case keys, as metrics-service writes them
  attributes:
    attributes === undefined
      ? null
      : JSON.stringify(Record.mapKeys(attributes, String.camelToSnake)),
  type,
})

const commonAttributes = (
  country: Country,
  platform: string
): Record<string, string | number> => ({
  appVersion: '26.9.0',
  appVersionCode: 260900000,
  appPlatform: platform,
  appSource: 'seed',
  clientCountryPrefix: country.prefix,
})

// One Increment row per day, country and platform carrying the day's count
const dailyCounts = (
  dayMs: number,
  name: string,
  weekly: number,
  attributes: (
    country: Country,
    platform: string
  ) => Readonly<Record<string, string | number | boolean>>
): readonly MetricRow[] =>
  Array.flatMap(COUNTRIES, (country) =>
    Array.filterMap(PLATFORMS, ([platform, platformShare]) => {
      const value = around(
        ((weekly * trend(dayMs)) / 7) * country.share * platformShare
      )
      return value === 0
        ? Option.none()
        : Option.some(
            metric(name, 'Increment', dayMs + between(0, DAY_MS - 1), value, {
              ...commonAttributes(country, platform),
              ...attributes(country, platform),
            })
          )
    })
  )

const SEND_TASK_TYPES: ReadonlyArray<readonly [string, number]> = [
  ['NewChatMessageNoticeSendTask', 41000],
  ['NewUserNoticeSendTask', 6200],
  ['NewClubUserNoticeSendTask', 2400],
  ['UserAdmittedToClubNoticeSendTask', 380],
  ['UserInactivityNoticeSendTask', 9800],
  ['UserLoginOnDifferentDeviceNoticeSendTask', 260],
  ['ClubFlaggedNoticeSendTask', 40],
  ['ClubExpiredNoticeSendTask', 90],
  ['NewContentNoticeSendTask', 5100],
  ['VexlProductNotificationSendTask', 3100],
]
// `sendTaskType` was added later, and feedback ratings are new
const SEND_TASK_TYPE_SINCE_MS = TODAY_MS - 200 * DAY_MS
const TRADE_FEEDBACK_SINCE_MS = TODAY_MS - 150 * DAY_MS
const CLUB_UUIDS = Array.makeBy(4, () => randomUUID())

const CHANNELS: ReadonlyArray<readonly [string, number]> = [
  ['push', 0.6],
  ['foreground_socket', 0.25],
  ['background_socket', 0.15],
]

const notificationsSent = (dayMs: number): readonly MetricRow[] =>
  Array.flatMap(CHANNELS, ([channel, channelShare]) =>
    Array.flatMap(PLATFORMS, ([clientPlatform, platformShare]) => {
      const attributes = {
        clientVersion: 260900000,
        clientPlatform,
        systemNotificationSent: channel === 'push',
        channel,
      }
      const share = channelShare * platformShare
      if (dayMs < SEND_TASK_TYPE_SINCE_MS) {
        const weekly = Array.reduce(
          SEND_TASK_TYPES,
          0,
          (sum, [, value]) => sum + value
        )
        return [
          metric(
            'NOTIFICATION_SENT',
            'Increment',
            dayMs + between(0, DAY_MS - 1),
            around(((weekly * trend(dayMs)) / 7) * share),
            attributes
          ),
        ]
      }
      return Array.map(SEND_TASK_TYPES, ([sendTaskType, weekly]) =>
        metric(
          'NOTIFICATION_SENT',
          'Increment',
          dayMs + between(0, DAY_MS - 1),
          around(((weekly * trend(dayMs)) / 7) * share),
          {...attributes, sendTaskType}
        )
      )
    })
  )

const backendCounters = (dayMs: number): readonly MetricRow[] => [
  ...dailyCounts(dayMs, 'USER_LOGGED_IN', 380, (country) => ({
    countryPrefix: country.prefix,
    numberExists: false,
  })),
  ...dailyCounts(dayMs, 'USER_LOGGED_IN', 60, (country) => ({
    countryPrefix: country.prefix,
    numberExists: true,
  })),
  ...dailyCounts(dayMs, 'OFFER_CREATED', 390, (country) => ({
    countryPrefix: country.prefix,
    offerType: 'BUY',
  })),
  ...dailyCounts(dayMs, 'OFFER_CREATED', 230, (country) => ({
    countryPrefix: country.prefix,
    offerType: 'SELL',
  })),
  ...dailyCounts(dayMs, 'REQUEST_SENT', 1700, () => ({})),
  ...dailyCounts(dayMs, 'USER_REACTIVATED', 440, () => ({
    daysInactive: between(30, 400),
    remindersReceived: between(0, 3),
    daysSinceLastReminder: 'none',
  })),
  // Reminder-driven returns below the 30-day window
  ...dailyCounts(dayMs, 'USER_REACTIVATED', 80, () => ({
    daysInactive: between(10, 29),
    remindersReceived: 1,
    daysSinceLastReminder: between(1, 9),
  })),
  ...dailyCounts(dayMs, 'USER_JOINED_CLUB_AND_IMPORTED_CONTACTS', 640, () => ({
    clubUUid: CLUB_UUIDS[between(0, CLUB_UUIDS.length - 1)],
    contactsImported: chance(0.7),
  })),
  ...notificationsSent(dayMs),
  ...(dayMs < TRADE_FEEDBACK_SINCE_MS
    ? []
    : [
        ...dailyCounts(dayMs, 'TRADE_FEEDBACK_SUBMITTED', 78, () => ({
          positive: true,
        })),
        ...dailyCounts(dayMs, 'TRADE_FEEDBACK_SUBMITTED', 17, () => ({
          positive: false,
        })),
      ]),
]

// Countries of one report are written one after another
const perCountryGauge = (
  timestampMs: number,
  name: string,
  valueOf: (country: Country) => number
): readonly MetricRow[] =>
  Array.map(COUNTRIES, (country, index) =>
    metric(name, 'Total', timestampMs + index, Math.round(valueOf(country)), {
      countryPrefix: country.prefix,
    })
  )

const backendGauges = (dayMs: number): readonly MetricRow[] => [
  ...Array.flatMap([0, 6, 12, 18], (hour) => {
    const timestampMs = dayMs + hour * 60 * 60 * 1000
    const jitter = (): number => 0.97 + random() * 0.06
    return [
      ...perCountryGauge(
        timestampMs,
        'TOTAL_BUY_OFFERS',
        (country) => 2600 * SCALE * country.share * trend(dayMs) * jitter()
      ),
      ...perCountryGauge(
        timestampMs,
        'TOTAL_SELL_OFFERS',
        (country) => 1500 * SCALE * country.share * trend(dayMs) * jitter()
      ),
      ...perCountryGauge(
        timestampMs,
        'MEDIAN_OFFER_VISIBILITY_PER_COUNTRY',
        (country) => country.medianReach * trend(dayMs) * jitter()
      ),
    ]
  }),
  ...perCountryGauge(
    dayMs,
    'COUNT_OF_ACTIVE_USERS_BY_COUNTRY',
    (country) => 21000 * SCALE * country.share * trend(dayMs)
  ),
  metric(
    'COUNT_OF_INACTIVE_USERS',
    'Total',
    dayMs,
    Math.round(54000 * SCALE * trend(dayMs) * (0.99 + random() * 0.02))
  ),
]

const SEEDED_METRICS = [
  'USER_LOGGED_IN',
  'OFFER_CREATED',
  'REQUEST_SENT',
  'USER_REACTIVATED',
  'USER_JOINED_CLUB_AND_IMPORTED_CONTACTS',
  'NOTIFICATION_SENT',
  'TRADE_FEEDBACK_SUBMITTED',
  'TOTAL_BUY_OFFERS',
  'TOTAL_SELL_OFFERS',
  'MEDIAN_OFFER_VISIBILITY_PER_COUNTRY',
  'COUNT_OF_ACTIVE_USERS_BY_COUNTRY',
  'COUNT_OF_INACTIVE_USERS',
]

// --- generate and write ----------------------------------------------------------

const generateStates = (): readonly StateRow[] => {
  const onboardings = Array.flatMap(DAYS, (dayMs) =>
    times(around((600 * trend(dayMs)) / 7), () => onboarding(dayMs))
  )
  const registrations = Array.getSomes(
    Array.map(onboardings, ({registration}) => registration)
  )
  const monthStarts = Array.dedupe(
    Array.map(DAYS, (dayMs) =>
      Date.parse(bucketStartDay('month', new Date(dayMs)))
    )
  )
  return [
    ...Array.map(onboardings, ({row}) => row),
    ...Array.flatMap(DAYS, (dayMs) => [
      ...times(around((300 * trend(dayMs)) / 7), () => offer(dayMs)),
      ...times(around((700 * trend(dayMs)) / 7), () => request(dayMs)),
      ...times(around((200 * trend(dayMs)) / 7), () => reactivation(dayMs)),
      ...notificationOpens(dayMs),
      ...prompts(dayMs),
    ]),
    ...Array.flatMap(Array.takeRight(DAYS, DAILY_DAYS), dailyActivity),
    ...weeklyActivity(registrations),
    ...Array.flatMap(
      Array.filter(monthStarts, (monthMs) => monthMs >= FIRST_DAY_MS),
      monthlyActivity
    ),
  ]
}

const generateMetrics = (): readonly MetricRow[] =>
  Array.flatMap(DAYS, (dayMs) => [
    ...backendCounters(dayMs),
    ...backendGauges(dayMs),
  ])

// Stays under Postgres' 65535 bind parameters per statement
const BATCH_ROWS = 4000

const insertAll = (
  table: 'analytics_states' | 'metrics',
  rows: ReadonlyArray<StateRow | MetricRow>
): Effect.Effect<void, unknown, PgClient.PgClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    yield* _(
      Effect.forEach(
        Array.chunksOf(rows, BATCH_ROWS),
        (batch) => sql`
          INSERT INTO
            ${sql(table)} ${sql.insert(batch)}
        `,
        {discard: true}
      )
    )
    console.log(`  ${table}: ${rows.length.toLocaleString('en')} rows`)
  })

class MissingTablesError extends Schema.TaggedError<MissingTablesError>(
  'MissingTablesError'
)('MissingTablesError', {database: Schema.String}) {
  get message(): string {
    return (
      `${this.database} has no analytics_states or metrics table. Start ` +
      'metrics-service once (pnpm dev:backend) so it runs its migrations.'
    )
  }
}

const seed = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const [tables] = yield* _(
    sql`
      SELECT
        to_regclass('analytics_states') IS NOT NULL
        AND to_regclass('metrics') IS NOT NULL AS ready
    `,
    Effect.flatMap(
      Schema.decodeUnknown(Schema.Tuple(Schema.Struct({ready: Schema.Boolean})))
    )
  )
  if (!tables.ready)
    return yield* _(new MissingTablesError({database: dbConfig.database}))

  console.log(
    `Seeding ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}, ` +
      `${dayOf(new Date(FIRST_DAY_MS))} to ${dayOf(new Date(TODAY_MS))}, scale ${SCALE}`
  )
  yield* _(sql`TRUNCATE analytics_states`)
  yield* _(sql`
    DELETE FROM metrics
    WHERE
      name IN ${sql.in(SEEDED_METRICS)}
  `)
  yield* _(insertAll('analytics_states', generateStates()))
  yield* _(insertAll('metrics', generateMetrics()))
  yield* _(sql`ANALYZE analytics_states`)
  yield* _(sql`ANALYZE metrics`)
  console.log('Done. Open /analytics in the backoffice.')
})

const SqlLive = PgClient.layer({
  ...dbConfig,
  transformQueryNames: String.camelToSnake,
  transformResultNames: String.snakeToCamel,
})

Effect.runPromise(seed.pipe(Effect.provide(Layer.orDie(SqlLive)))).catch(
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
