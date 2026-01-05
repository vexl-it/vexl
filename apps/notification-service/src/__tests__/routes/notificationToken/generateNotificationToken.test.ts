import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
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

const nonExistentSecret = Schema.decodeSync(VexlNotificationTokenSecret)(
  '550e8400-e29b-41d4-a716-446655440000'
)

describe('GenerateNotificationToken', () => {
  it('Should generate token for valid secret', async () => {
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
        const resp = yield* _(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: createResp.right.secret,
            },
          }),
          Effect.either
        )

        console.log(resp)
        expect(resp._tag).toEqual('Right')
        if (resp._tag === 'Right') {
          expect(resp.right.token).toBeDefined()
        }
      })
    )
  })

  it('Should fail with NotFoundError when secret not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const resp = yield* _(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: nonExistentSecret,
            },
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Left')
        if (resp._tag === 'Left') {
          expect(resp.left._tag).toEqual('NotFoundError')
        }
      })
    )
  })
})
