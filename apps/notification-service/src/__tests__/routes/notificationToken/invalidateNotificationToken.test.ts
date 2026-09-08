import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, pipe, Schema} from 'effect'
import {NotificationTokensDb} from '../../../services/NotificationTokensDb'
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

describe('InvalidateNotificationToken', () => {
  it('Should delete token successfully', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

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
        const generateResp = yield* pipe(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: createResp.success.secret,
            },
          }),
          Effect.result
        )

        expect(generateResp._tag).toEqual('Success')
        if (generateResp._tag !== 'Success') return

        // Then invalidate the token
        const resp = yield* pipe(
          app.NotificationTokenGroup.invalidateNotificationToken({
            payload: {
              secret: createResp.success.secret,
              tokenToInvalidate: generateResp.success.token,
            },
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
        const tokenOwner = yield* db.findSecretByNotificationToken(
          generateResp.success.token
        )
        expect(Option.isNone(tokenOwner)).toEqual(true)
      })
    )
  })

  it('Should keep token when invalidated with a different secret', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

        const firstSecret = yield* pipe(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(firstSecret._tag).toEqual('Success')
        if (firstSecret._tag !== 'Success') return

        const secondSecret = yield* pipe(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(secondSecret._tag).toEqual('Success')
        if (secondSecret._tag !== 'Success') return

        const generateResp = yield* pipe(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {
              secret: firstSecret.success.secret,
            },
          }),
          Effect.result
        )

        expect(generateResp._tag).toEqual('Success')
        if (generateResp._tag !== 'Success') return

        const resp = yield* pipe(
          app.NotificationTokenGroup.invalidateNotificationToken({
            payload: {
              secret: secondSecret.success.secret,
              tokenToInvalidate: generateResp.success.token,
            },
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
        const tokenOwner = yield* db.findSecretByNotificationToken(
          generateResp.success.token
        )
        expect(Option.isSome(tokenOwner)).toEqual(true)
        if (Option.isNone(tokenOwner)) return
        expect(tokenOwner.value.secret).toEqual(firstSecret.success.secret)
      })
    )
  })
})
