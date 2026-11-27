import {
  HttpClient,
  HttpClientResponse,
  type HttpClientRequest,
} from '@effect/platform'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Array, Cause, Effect, Schema} from 'effect'
import {AppSource} from '../../commonHeaders'
import {ServiceUrl} from '../../ServiceUrl.brand'
import {api} from './index'
import {OfferStatsResponse} from './offerStats'

const stats = [{countryPrefix: 420, count: 75}]

describe('public offer stats', () => {
  it('sends no user metadata or credentials through the offer API accessor', async () => {
    const requests: HttpClientRequest.HttpClientRequest[] = []
    let credentialReads = 0
    const client = HttpClient.make((request) => {
      requests.push(request)
      return Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(JSON.stringify(stats), {
            headers: {'content-type': 'application/json'},
          })
        )
      )
    })

    const result = await Effect.runPromise(
      Effect.gen(function* (_) {
        const offerApi = yield* _(
          api({
            platform: 'IOS',
            clientVersion: Schema.decodeUnknownSync(VersionCode)(260800100),
            clientSemver: Schema.decodeUnknownSync(VersionString)('26.8.1'),
            url: Schema.decodeUnknownSync(ServiceUrl)('https://offers.test'),
            language: 'cs',
            appSource: Schema.decodeUnknownSync(AppSource)('TESTFLIGHT'),
            isDeveloper: true,
            deviceModel: 'private-device',
            osVersion: 'private-version',
            prefix: Schema.decodeUnknownSync(CountryPrefix)(420),
            getUserSessionCredentials: () => {
              credentialReads++
              throw new Cause.NoSuchElementException()
            },
          })
        )
        return yield* _(offerApi.getOfferStats())
      }).pipe(Effect.provideService(HttpClient.HttpClient, client))
    )

    expect(result).toEqual(stats)
    expect(credentialReads).toBe(0)
    expect(requests).toHaveLength(1)
    const request = Array.unsafeGet(requests, 0)
    expect(request.url).toBe('https://offers.test/offers/stats')
    expect(request.method).toBe('GET')
    expect(request.urlParams).toEqual([])
    expect(request.body._tag).toBe('Empty')
    for (const header of [
      'vexl-app-meta',
      'user-agent',
      'authorization',
      'public-key',
      'hash',
      'signature',
    ]) {
      expect(request.headers[header]).toBeUndefined()
    }
  })

  it('validates the public response', () => {
    expect(Schema.decodeUnknownSync(OfferStatsResponse)(stats)).toEqual(stats)
    for (const invalid of [
      [{countryPrefix: null, count: 1}],
      [{countryPrefix: 420, count: -1}],
      [{countryPrefix: 420, count: 1.5}],
    ]) {
      expect(Schema.is(OfferStatsResponse)(invalid)).toBe(false)
    }
  })
})
