import {AnalyticsStateUpsert} from '@vexl-next/analytics-definitions/src/core'
import {decapsulateRequest} from '@vexl-next/cryptography/src/operations/ohttp'
import {OhttpGatewaySecret} from '@vexl-next/cryptography/src/operations/ohttp.brand'
import {Effect, Option, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {version} from '../environment'
import {AnalyticsUploadError, uploadAnalyticsStateAtom} from './relay'

// Test-only key pair, key id 9
const gatewaySecret = OhttpGatewaySecret.make(
  'CeylOk9mbEW54Sy1C0iAeeBZDmmbGeGrrRoedpa+0yIH'
)

jest.mock('../../api', () => ({
  platform: 'IOS',
  sessionCountryPrefixAtom: jest
    .requireActual('jotai')
    .atom(jest.requireActual('effect').Option.some(420)),
}))

jest.mock('./relayConfig', () => ({
  analyticsRelayAtom: jest.requireActual('jotai').atom(
    jest.requireActual('effect').Option.some({
      relayUrls: ['http://relay.test/vexl-analytics'],
      gatewayKeyConfig:
        'CQAgphsQGbIEJaMHeIr1uINo4p3TFzLtJt8uSZdfIFOf5msABAABAAM=',
    })
  ),
}))

const state = Schema.decodeSync(AnalyticsStateUpsert)({
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'journey',
  name: 'onboarding',
  schemaVersion: 1,
  revision: 0,
  startDay: '2026-09-21',
  updatedDay: '2026-09-21',
  payload: {step: 'opened'},
})

const fetchMock = jest.fn()
beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock
})

const upload = Option.getOrThrow(
  getDefaultStore().get(uploadAnalyticsStateAtom)
)

describe('uploadAnalyticsStateAtom', () => {
  it('posts only an encrypted body and its content type to the relay', async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 204}))

    await Effect.runPromise(upload(state))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://relay.test/vexl-analytics')
    expect(init).toEqual({
      method: 'POST',
      headers: {'content-type': 'message/ohttp-req'},
      body: expect.any(Uint8Array),
    })

    const plaintext = await Effect.runPromise(
      decapsulateRequest({gatewaySecrets: [gatewaySecret], request: init.body})
    )
    expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual({
      client: {platform: 'IOS', semver: version, prefix: 420},
      state,
    })
  })

  it('fails with the response status when the relay does not accept', async () => {
    fetchMock.mockResolvedValue(new Response(null, {status: 400}))

    const error = await Effect.runPromise(Effect.flip(upload(state)))
    expect(error).toEqual(new AnalyticsUploadError({status: 400}))
  })
})
