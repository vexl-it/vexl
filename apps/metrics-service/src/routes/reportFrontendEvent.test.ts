import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Option, Schema} from 'effect'
import {
  frontendEventToMetricName,
  frontendEventToMetricRecord,
} from './reportFrontendEvent'

const eventId = Schema.decodeSync(Uuid)('00000000-0000-4000-8000-000000000002')
const analyticsId = Schema.decodeSync(Uuid)(
  '00000000-0000-4000-8000-000000000001'
)

const headers = makeCommonHeaders({
  appSource: Schema.decodeSync(AppSource)('appStore'),
  versionCode: Schema.decodeSync(VersionCode)(123),
  semver: Schema.decodeSync(SemverString)('1.2.3'),
  platform: Schema.decodeSync(PlatformName)('IOS'),
  isDeveloper: false,
  language: 'en',
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.none(),
})

describe('reportFrontendEvent helpers', () => {
  it('maps frontend event names to FE metric names', () => {
    expect(frontendEventToMetricName('sessionStarted')).toBe(
      'FE_SESSION_STARTED'
    )
    expect(frontendEventToMetricName('offerRequested')).toBe(
      'FE_OFFER_REQUESTED'
    )
    expect(frontendEventToMetricName('offerRequestAcceptedByOtherSide')).toBe(
      'FE_OFFER_REQUEST_ACCEPTED_BY_OTHER_SIDE'
    )
  })

  it('stores frontend-provided event id, analytics id, date, and attributes', () => {
    const date = new Date('2026-05-18T12:00:00.000Z')
    const record = frontendEventToMetricRecord({
      headers,
      payload: {
        id: eventId,
        analyticsId,
        event: 'chatClosed',
        date,
        attributes: {source: 'test'},
      },
    })

    expect(record.uuid).toBe(eventId)
    expect(record.analyticsUuid).toBe(analyticsId)
    expect(record.timestamp).toBe(date)
    expect(record.attributes?.source).toBe('test')
    expect(record.attributes?.client_platform).toBe('IOS')
  })

  it('adds app metadata from common headers when event attributes are empty', () => {
    const record = frontendEventToMetricRecord({
      headers,
      payload: {
        id: eventId,
        analyticsId,
        event: 'sessionStarted',
        date: new Date('2026-05-18T12:00:00.000Z'),
      },
    })

    expect(record.attributes).toEqual({
      client_version: 123,
      client_semver: '1.2.3',
      client_platform: 'IOS',
      app_source: 'appStore',
      language: 'en',
      is_developer: false,
    })
  })

  it('uses common headers as the source of truth for app metadata', () => {
    const record = frontendEventToMetricRecord({
      headers,
      payload: {
        id: eventId,
        analyticsId,
        event: 'sessionStarted',
        date: new Date('2026-05-18T12:00:00.000Z'),
        attributes: {
          clientVersion: 999,
          client_version: 999,
          clientSemver: '9.9.9',
          client_semver: '9.9.9',
          clientPlatform: 'ANDROID',
          client_platform: 'ANDROID',
          appSource: 'spoofed',
          app_source: 'spoofed',
          language: 'xx',
          isDeveloper: true,
          is_developer: true,
          source: 'test',
        },
      },
    })

    expect(record.attributes).toEqual({
      source: 'test',
      client_version: 123,
      client_semver: '1.2.3',
      client_platform: 'IOS',
      app_source: 'appStore',
      language: 'en',
      is_developer: false,
    })
  })
})
