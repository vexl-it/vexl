import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverStringE} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  CommonHeaders,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const validVersionCode = Schema.decodeSync(VersionCode)(100)
const validSemver = Schema.decodeSync(SemverStringE)('1.0.0')
const validAppSource = Schema.decodeSync(AppSource)('playStore')
const validExpoToken = Schema.decodeSync(ExpoNotificationTokenE)(
  'ExponentPushToken[yyyyyyyyyyyyyyyyyyy]'
)
const validExpoTokenUpdate = Schema.decodeSync(ExpoNotificationTokenE)(
  'ExponentPushToken[zzzzzzzzzzzzzzzzzzzz]'
)

const validHeaders = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: validVersionCode,
  semver: validSemver,
  appSource: validAppSource,
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
})

describe('UpdateNotificationInfo', () => {
  it('Should update notification info successfully', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // First create a secret
        const createResp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.either
        )

        expect(createResp._tag).toEqual('Right')
        if (createResp._tag !== 'Right') return

        // Then update it
        const resp = yield* _(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.right.secret,
              expoNotificationToken: validExpoTokenUpdate,
            },
            headers: validHeaders,
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })

  it('Should fail with MissingCommonHeadersError when headers are missing', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // First create a secret
        const createResp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.either
        )

        expect(createResp._tag).toEqual('Right')
        if (createResp._tag !== 'Right') return

        // Create headers with UnknownUserAgentHeader (no vexl-app-meta)
        const headersWithoutVexlMeta = new CommonHeaders({
          'user-agent': {
            _tag: 'UnknownUserAgentHeader',
            userAgent: Option.none(),
          },
          'cf-connecting-ip': Option.none(),
          'X-Platform': Option.none(),
          'client-version': Option.none(),
        })

        const resp = yield* _(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.right.secret,
            },
            headers: headersWithoutVexlMeta,
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Left')
      })
    )
  })
})
