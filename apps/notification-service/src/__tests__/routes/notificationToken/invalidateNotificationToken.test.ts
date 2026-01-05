import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const validVersionCode = Schema.decodeSync(VersionCode)(100)
const validSemver = Schema.decodeSync(SemverString)('1.0.0')
const validAppSource = Schema.decodeSync(AppSource)('playStore')
const validExpoToken = Schema.decodeSync(ExpoNotificationToken)(
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

describe('InvalidateNotificationToken', () => {
  it('Should delete token successfully', async () => {
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

        // Then generate a token
        const generateResp = yield* _(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: createResp.right.secret,
            },
          }),
          Effect.either
        )

        expect(generateResp._tag).toEqual('Right')
        if (generateResp._tag !== 'Right') return

        // Then invalidate the token
        const resp = yield* _(
          app.NotificationTokenGroup.invalidateNotificationToken({
            payload: {
              secret: createResp.right.secret,
              tokenToInvalidate: generateResp.right.token,
            },
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
