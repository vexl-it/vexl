import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverStringE} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const validVersionCode = Schema.decodeSync(VersionCode)(100)
const validSemver = Schema.decodeSync(SemverStringE)('1.0.0')
const validAppSource = Schema.decodeSync(AppSource)('playStore')
const validExpoToken = Schema.decodeSync(ExpoNotificationTokenE)(
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
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

describe('InvalidateNotificationSecret', () => {
  it('Should delete secret successfully', async () => {
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

        // Then delete the secret
        const resp = yield* _(
          app.NotificationTokenGroup.invalidateNotificationSecret({
            payload: {
              secretToInvalidate: createResp.right.secret,
            },
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
