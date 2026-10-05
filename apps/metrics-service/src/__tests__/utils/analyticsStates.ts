import {SqlClient} from '@effect/sql'
import {dayOf} from '@vexl-next/analytics-definitions/src/buckets'
import {
  AnalyticsStateId,
  type AnalyticsStateUpsert,
  type DayString,
} from '@vexl-next/analytics-definitions/src/core'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
  type CommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {randomUUID} from 'crypto'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from './NodeTestingApp'

const DAY_MS = 24 * 60 * 60 * 1000

export const daysAgo = (days: number): DayString =>
  dayOf(new Date(Date.now() - days * DAY_MS))

export const newStateId = (): AnalyticsStateId =>
  Schema.decodeSync(AnalyticsStateId)(randomUUID())

export const iosHeadersWithPrefix = makeCommonHeaders({
  platform: 'IOS',
  versionCode: Schema.decodeSync(VersionCode)(260905),
  semver: Schema.decodeSync(VersionString)('26.9.5'),
  appSource: Schema.decodeSync(AppSource)('appStore'),
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.some(Schema.decodeSync(CountryPrefix)(420)),
})

export const onboardingUpsert = (
  overrides: Partial<AnalyticsStateUpsert> = {}
): AnalyticsStateUpsert => ({
  id: newStateId(),
  kind: 'journey',
  name: 'onboarding',
  schemaVersion: 1,
  revision: 0,
  startDay: daysAgo(0),
  updatedDay: daysAgo(0),
  payload: {step: 'opened'},
  ...overrides,
})

export const upsertState = (
  payload: AnalyticsStateUpsert,
  headers: CommonHeaders = iosHeadersWithPrefix
): Effect.Effect<
  unknown,
  unknown,
  Effect.Effect.Context<typeof NodeTestingApp>
> =>
  NodeTestingApp.pipe(
    Effect.flatMap((client) => client.upsertAnalyticsState({payload, headers}))
  )

const StoredAnalyticsState = Schema.Struct({
  id: Schema.NullOr(Schema.String),
  kind: Schema.String,
  name: Schema.String,
  schemaVersion: Schema.Number,
  revision: Schema.Number,
  startDay: Schema.String,
  updatedDay: Schema.String,
  payload: Schema.Unknown,
  appPlatform: Schema.String,
  appMajorVersion: Schema.String,
  countryPrefix: Schema.String,
})
export type StoredAnalyticsState = typeof StoredAnalyticsState.Type

export const readStoredStates = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const rows = yield* _(sql`
    SELECT
      id,
      kind,
      name,
      schema_version,
      revision,
      start_day::text AS start_day,
      updated_day::text AS updated_day,
      payload,
      app_platform,
      app_major_version,
      country_prefix
    FROM
      analytics_states
    ORDER BY
      pk
  `)
  return yield* _(
    Schema.decodeUnknown(Schema.Array(StoredAnalyticsState))(rows)
  )
})

export const clearStoredStates = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`DELETE FROM analytics_states`
)

export const insertStoredState = (row: {
  id: string | null
  kind: 'journey' | 'aggregation'
  name: string
  startDay: DayString
}): Effect.Effect<void, unknown, SqlClient.SqlClient> =>
  Effect.flatMap(
    SqlClient.SqlClient,
    (sql) => sql`
      INSERT INTO
        analytics_states (
          id,
          kind,
          name,
          schema_version,
          revision,
          start_day,
          updated_day,
          payload,
          app_platform,
          app_major_version,
          country_prefix
        )
      VALUES
        (
          ${row.id},
          ${row.kind},
          ${row.name},
          1,
          0,
          ${row.startDay},
          ${row.startDay},
          '{}'::jsonb,
          'IOS',
          '26.9',
          'none'
        )
    `
  )
