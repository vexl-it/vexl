import {Duration, Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import bundledRelaysJson from '../../../../../analytics-relays.json'
import {preferencesAtom} from '../preferences'
import {
  AnalyticsRelaysFile,
  analyticsRelayAtom,
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
  preferencesAtom: jest.requireActual('jotai').atom({analyticsEnabled: false}),
}))

const bundled = Schema.decodeUnknownSync(AnalyticsRelaysFile)(bundledRelaysJson)
const newerRelay = {
  relayUrls: ['https://newer.relay.test/vexl-analytics'],
  gatewayKeyConfig: 'CQAgphsQGbIEJaMHeIr1uINo4p3TFzLtJt8uSZdfIFOf5msABAABAAM=',
}

const store = getDefaultStore()
const fetchMock = jest.fn()
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
    store.set(preferencesAtom, (old) => ({...old, analyticsEnabled: true}))
    fetchMock.mockResolvedValue(
      Response.json({
        revision: bundled.revision + 1,
        stage: {...newerRelay, relayUrls: ['http://relay.test']},
      })
    )

    await refresh()
    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.get(analyticsRelayAtom)).toEqual(
      Option.fromNullable(bundled.stage)
    )
  })

  it('uses a newer fetched list and fetches at most once a day', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + Duration.toMillis(Duration.days(1)))
    fetchMock.mockResolvedValue(
      Response.json({revision: bundled.revision + 1, stage: newerRelay})
    )

    await refresh()
    await refresh()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.get(analyticsRelayAtom)).toEqual(Option.some(newerRelay))
  })
})
