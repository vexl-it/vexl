import {OhttpKeyConfig} from '@vexl-next/cryptography/src/operations/ohttp.brand'
import {ServiceUrl} from '@vexl-next/rest-api/src/ServiceUrl.brand'
import {Duration, Effect, Option, Schema} from 'effect'
import {atom} from 'jotai'
import bundledRelaysJson from '../../../../../analytics-relays.json'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {apiPreset} from '../environment'
import {analyticsEnabledAtom} from './atoms'

const RELAYS_URL =
  'https://raw.githubusercontent.com/vexl-it/vexl/main/analytics-relays.json'
const REFRESH_INTERVAL = Duration.days(1)

const AnalyticsRelay = Schema.Struct({
  relayUrls: Schema.NonEmptyArray(ServiceUrl),
  gatewayKeyConfig: OhttpKeyConfig,
})
export type AnalyticsRelay = typeof AnalyticsRelay.Type

const PublicAnalyticsRelay = Schema.Struct({
  relayUrls: Schema.NonEmptyArray(
    ServiceUrl.pipe(Schema.filter((url) => url.startsWith('https://')))
  ),
  gatewayKeyConfig: OhttpKeyConfig,
})

/** `analytics-relays.json` at the repo root. Old apps read it forever: only add fields. */
export const AnalyticsRelaysFile = Schema.Struct({
  revision: Schema.NonNegativeInt,
  prod: Schema.optional(PublicAnalyticsRelay),
  stage: Schema.optional(PublicAnalyticsRelay),
})
type AnalyticsRelaysFile = typeof AnalyticsRelaysFile.Type

const bundledRelays = Schema.decodeUnknownOption(AnalyticsRelaysFile)(
  bundledRelaysJson
).pipe(Option.getOrElse((): AnalyticsRelaysFile => ({revision: 0})))

const fetchedRelaysAtom = atomWithParsedMmkvStorage(
  'analyticsRelays',
  {},
  Schema.Struct({
    fetchedAt: Schema.optional(Schema.Number),
    file: Schema.optional(AnalyticsRelaysFile),
  })
)

const localRelay = Schema.decodeUnknownOption(AnalyticsRelay)({
  relayUrls: [process.env.EXPO_PUBLIC_LOCAL_ANALYTICS_RELAY],
  gatewayKeyConfig: process.env.EXPO_PUBLIC_LOCAL_ANALYTICS_GATEWAY_KEY_CONFIG,
})

/** None disables uploads: there is no direct, non-relayed path. */
export const analyticsRelayAtom = atom((get): Option.Option<AnalyticsRelay> => {
  if (apiPreset === 'localEnv') return localRelay

  const fetched = get(fetchedRelaysAtom).file
  const relays =
    fetched && fetched.revision > bundledRelays.revision
      ? fetched
      : bundledRelays
  return Option.fromNullable(
    apiPreset === 'prodEnv' ? relays.prod : relays.stage
  )
})

/** At most once a day, failed attempts included, and only for opted-in installs. Failures keep the previous relays. */
export const refreshAnalyticsRelaysActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> => {
    const {fetchedAt} = get(fetchedRelaysAtom)
    if (
      apiPreset === 'localEnv' ||
      !get(analyticsEnabledAtom) ||
      (fetchedAt !== undefined &&
        Date.now() - fetchedAt < Duration.toMillis(REFRESH_INTERVAL))
    )
      return Effect.void

    set(fetchedRelaysAtom, (old) => ({...old, fetchedAt: Date.now()}))
    return Effect.tryPromise(async () => {
      const response = await fetch(RELAYS_URL)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json: unknown = await response.json()
      return json
    }).pipe(
      Effect.flatMap(Schema.decodeUnknown(AnalyticsRelaysFile)),
      Effect.timeout(Duration.seconds(10)),
      Effect.tap((file) =>
        Effect.sync(() => {
          set(fetchedRelaysAtom, (old) => ({...old, file}))
        })
      ),
      Effect.ignore
    )
  }
)
