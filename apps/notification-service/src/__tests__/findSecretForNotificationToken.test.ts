import {
  VEXL_TOKEN_PREFIX,
  VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {findSecretForNotificationToken} from '../services/NotificationTokensDb'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const headers = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: Schema.decodeSync(VersionCode)(100),
  semver: Schema.decodeSync(VersionString)('1.0.0'),
  appSource: Schema.decodeSync(AppSource)('playStore'),
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.none(),
})

describe('findSecretForNotificationToken', () => {
  it('resolves a generated token to its secret', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const {secret} = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {},
            headers,
          })
        )
        const {token} = yield* _(
          app.NotificationTokenGroup.generateNotificationToken({
            payload: {secret},
          })
        )

        expect(yield* _(findSecretForNotificationToken(token))).toEqual(secret)
      })
    )
  })

  it('rejects an unknown token as invalid', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const unknownToken = Schema.decodeSync(VexlNotificationToken)(
          `${VEXL_TOKEN_PREFIX}550e8400-e29b-41d4-a716-446655440000`
        )
        const result = yield* _(
          findSecretForNotificationToken(unknownToken),
          Effect.either
        )

        expect(result._tag).toEqual('Left')
        if (result._tag !== 'Left') return
        expect(result.left).toMatchObject({
          _tag: 'SendingNotificationError',
          tokenInvalid: true,
        })
      })
    )
  })
})
