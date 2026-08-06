import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'
import {commonMetricAttributesFromHeaders} from './commonMetricAttributesFromHeaders'

describe('commonMetricAttributesFromHeaders', () => {
  it('extracts common metric attributes from the Vexl app metadata header', () => {
    const headers = Schema.decodeSync(CommonHeaders)({
      'user-agent': 'Vexl/580 (1.2.3) ANDROID',
      'vexl-app-meta': JSON.stringify({
        appSource: 'com.android.vending',
        versionCode: 580,
        platform: 'ANDROID',
        semver: '1.2.3',
        language: 'en',
        isDeveloper: false,
        prefix: 420,
      }),
    })

    expect(commonMetricAttributesFromHeaders(headers)).toEqual({
      appVersion: '1.2.3',
      appVersionCode: 580,
      appPlatform: 'ANDROID',
      appSource: 'com.android.vending',
      clientCountryPrefix: 420,
    })
  })

  it('uses fallbacks when the metadata is unavailable', () => {
    const headers = Schema.decodeSync(CommonHeaders)({
      'user-agent': undefined,
    })

    expect(commonMetricAttributesFromHeaders(headers)).toEqual({
      appVersion: 'unknown',
      appVersionCode: 'unknown',
      appPlatform: 'unknown',
      appSource: 'unknown',
      clientCountryPrefix: 'none',
    })
  })
})
