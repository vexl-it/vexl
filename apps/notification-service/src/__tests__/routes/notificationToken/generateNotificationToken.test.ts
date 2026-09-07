import {
  VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const validVersionCode = Schema.decodeSync(VersionCode)(100)
const validSemver = Schema.decodeSync(VersionString)('1.0.0')
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
  prefix: Option.none(),
})

const nonExistentSecret = Schema.decodeSync(VexlNotificationTokenSecret)(
  VEXL_NOTIFICATION_TOKEN_SECRET_TEMPORARY_PREFIX +
    '550e8400-e29b-41d4-a716-446655440000'
)

describe('GenerateNotificationToken', () => {
  it('Should generate token for valid secret', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        // First create a secret
        const createResp = yield* pipe(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(createResp._tag).toEqual('Success')
        if (createResp._tag !== 'Success') return

        // Then generate a token
        const resp = yield* pipe(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: createResp.success.secret,
            },
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
        if (resp._tag === 'Success') {
          expect(resp.success.token).toBeDefined()
        }
      })
    )
  })

  it('Should fail with NotFoundError when secret not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const resp = yield* pipe(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: nonExistentSecret,
            },
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Failure')
        if (resp._tag === 'Failure') {
          expect(resp.failure._tag).toEqual('NotFoundError')
        }
      })
    )
  })
})
