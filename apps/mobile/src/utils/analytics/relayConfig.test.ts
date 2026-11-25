import {
  ANALYTICS_RELAYS_PUBLIC_KEYS,
  isAnalyticsRelaysSignatureValid,
  signAnalyticsRelays,
} from '@vexl-next/cryptography/src/operations/analyticsRelaysSignature'
import {Duration, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {generateKeyPairSync, X509Certificate} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import bundledRelaysJson from '../../../../../analytics-relays.json'
import {preferencesAtom} from '../preferences'
import {analyticsOptInAtom} from './optIn'
import {
  analyticsRelayAtom,
  AnalyticsRelaysFile,
  refreshAnalyticsRelaysActionAtom,
} from './relayConfig'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {},
}))
jest.mock('../reportError', () => ({__esModule: true, default: jest.fn()}))
jest.mock('../mmkv/mmkvDataLossDiagnosticStorage', () => ({
  recordCriticalMmkvKeyPersisted: jest.fn(async () => undefined),
}))
jest.mock('../preferences', () => ({
  preferencesAtom: Object.assign(jest.requireActual('jotai').atom({}), {
    flushNow: jest.fn(),
  }),
}))

const bundled = Schema.decodeUnknownSync(AnalyticsRelaysFile)(bundledRelaysJson)
const newerRelay = {
  relayUrls: ['https://newer.relay.test/vexl-analytics'],
  gatewayKeyConfig: 'CQAgphsQGbIEJaMHeIr1uINo4p3TFzLtJt8uSZdfIFOf5msABAABAAM=',
}

const testKey = generateKeyPairSync('rsa', {modulusLength: 2048})
// The app trusts every key in this object, so adding one lets the tests sign files.
Object.assign(ANALYTICS_RELAYS_PUBLIC_KEYS, {
  test: testKey.publicKey.export({type: 'spki', format: 'pem'}).toString(),
})
const signed = (
  file: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> =>
  signAnalyticsRelays({
    file,
    keyId: 'test',
    privateKeyPem: testKey.privateKey
      .export({type: 'pkcs8', format: 'pem'})
      .toString(),
  })

const store = getDefaultStore()
const fetchMock = jest.fn()
const nextDay = (): void => {
  jest
    .spyOn(Date, 'now')
    .mockReturnValue(Date.now() + Duration.toMillis(Duration.days(1)))
}
const refresh = async (): Promise<void> => {
  await Effect.runPromise(store.set(refreshAnalyticsRelaysActionAtom))
}

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock
})

describe('analytics relays', () => {
  it('starts with the relays bundled from analytics-relays.json', () => {
    expect(store.get(analyticsRelayAtom)).toEqual(
      Option.fromNullable(bundled.stage)
    )
  })

  it('does not fetch the relays without consent', async () => {
    await refresh()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores an invalid or plain http relay list and retries it at most once a day', async () => {
    store.set(preferencesAtom, (old) => ({...old, analyticsConsent: 'granted'}))
    fetchMock.mockResolvedValue(
      Response.json(
        signed({
          revision: bundled.revision + 1,
          stage: {...newerRelay, relayUrls: ['http://relay.test']},
        })
      )
    )

    await refresh()
    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.get(analyticsRelayAtom)).toEqual(
      Option.fromNullable(bundled.stage)
    )
  })

  it('ignores a newer list that is unsigned or was changed after signing', async () => {
    const newer = {revision: bundled.revision + 1, stage: newerRelay}

    nextDay()
    fetchMock.mockResolvedValue(Response.json(newer))
    await refresh()
    nextDay()
    fetchMock.mockResolvedValue(
      Response.json({...signed(newer), revision: bundled.revision + 2})
    )
    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.get(analyticsRelayAtom)).toEqual(
      Option.fromNullable(bundled.stage)
    )
  })

  it('uses a newer signed list and fetches at most once a day', async () => {
    nextDay()
    fetchMock.mockResolvedValue(
      Response.json(signed({revision: bundled.revision + 1, stage: newerRelay}))
    )

    await refresh()
    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.get(analyticsRelayAtom)).toEqual(Option.some(newerRelay))
  })

  it('keeps the list in use when a signed list with the same or a lower revision is replayed', async () => {
    nextDay()
    fetchMock.mockResolvedValue(
      Response.json(signed({revision: bundled.revision + 1}))
    )

    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.get(analyticsRelayAtom)).toEqual(Option.some(newerRelay))
  })

  it('forgets the fetched list and its fetch time on opt-out', async () => {
    store.set(analyticsOptInAtom, false)
    store.set(analyticsOptInAtom, true)

    expect(store.get(analyticsRelayAtom)).toEqual(
      Option.fromNullable(bundled.stage)
    )
    await refresh()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('analytics-relays.json signature', () => {
  it('trusts the key of the over-the-air update certificate', () => {
    const certificate = new X509Certificate(
      readFileSync(
        join(__dirname, '../../../certs/ota-updates-certificate.pem')
      )
    )

    expect(ANALYTICS_RELAYS_PUBLIC_KEYS.main).toBe(
      certificate.publicKey.export({type: 'spki', format: 'pem'})
    )
  })

  it('is valid for the committed file', () => {
    expect(isAnalyticsRelaysSignatureValid(bundledRelaysJson)).toBe(true)
  })
})
