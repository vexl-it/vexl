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
  timestampWithFrontendEventJitter,
} from './reportFrontendEvent'

const analyticsUuid = Schema.decodeSync(Uuid)(
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
    expect(frontendEventToMetricName('offerRequested')).toBe(
      'FE_OFFER_REQUESTED'
    )
    expect(frontendEventToMetricName('offerRequestAcceptedByOtherSide')).toBe(
      'FE_OFFER_REQUEST_ACCEPTED_BY_OTHER_SIDE'
    )
  })

  it('jitters timestamps within receipt time plus thirty minutes', () => {
    const now = new Date('2026-05-18T12:00:00.000Z')
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999999)
    const timestamp = timestampWithFrontendEventJitter(now)

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(now.getTime())
    expect(timestamp.getTime()).toBeLessThanOrEqual(
      now.getTime() + 30 * 60 * 1000
    )

    randomSpy.mockRestore()
  })

  it('creates unique metric uuids while allowing duplicate analytics uuid', () => {
    const now = new Date('2026-05-18T12:00:00.000Z')
    const first = frontendEventToMetricRecord({
      headers,
      payload: {analyticsUuid, event: 'chatClosed'},
      now,
    })
    const second = frontendEventToMetricRecord({
      headers,
      payload: {analyticsUuid, event: 'chatClosed'},
      now,
    })

    expect(first.analyticsUuid).toBe(analyticsUuid)
    expect(second.analyticsUuid).toBe(analyticsUuid)
    expect(first.uuid).not.toBe(second.uuid)
  })
})
