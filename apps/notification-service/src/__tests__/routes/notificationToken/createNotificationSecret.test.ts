import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  CommonHeaders,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, Option, Schema} from 'effect'
import {NotificationTokensDb} from '../../../services/NotificationTokensDb'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const validVersionCode = Schema.decodeSync(VersionCode)(100)
const validSemver = Schema.decodeSync(SemverString)('1.0.0')
const validAppSource = Schema.decodeSync(AppSource)('playStore')
const validExpoToken = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
)
const duplicateExpoToken = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[createDuplicateToken]'
)

const validPrefix = Schema.decodeSync(CountryPrefix)(420)

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

const validHeadersWithPrefix = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: validVersionCode,
  semver: validSemver,
  appSource: validAppSource,
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.some(validPrefix),
})

describe('CreateNotificationSecret', () => {
  it('Should create notification secret with valid payload and headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const resp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
        if (resp._tag === 'Right') {
          expect(resp.right.secret).toBeDefined()
        }
      })
    )
  })

  it('Should create notification secret with client prefix and verify it is saved', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const db = yield* _(NotificationTokensDb)

        const resp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeadersWithPrefix,
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
        if (resp._tag !== 'Right') return

        // Verify the prefix was saved correctly
        const savedRecord = yield* _(
          db.findSecretBySecretValue(resp.right.secret)
        )

        expect(Option.isSome(savedRecord)).toBe(true)
        if (Option.isNone(savedRecord)) return

        expect(savedRecord.value.clientPrefix).toEqual(validPrefix)
      })
    )
  })

  it('Should keep a duplicate expo token only on the newest secret', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const db = yield* _(NotificationTokensDb)

        const firstResp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: duplicateExpoToken,
            },
            headers: validHeaders,
          })
        )

        const secondResp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: duplicateExpoToken,
            },
            headers: validHeaders,
          })
        )

        const firstRecord = yield* _(
          db.findSecretBySecretValue(firstResp.secret)
        )
        const secondRecord = yield* _(
          db.findSecretBySecretValue(secondResp.secret)
        )

        expect(Option.isSome(firstRecord)).toBe(true)
        expect(Option.isSome(secondRecord)).toBe(true)
        if (Option.isNone(firstRecord) || Option.isNone(secondRecord)) return

        expect(firstRecord.value.expoNotificationToken).toBeNull()
        expect(secondRecord.value.expoNotificationToken).toEqual(
          duplicateExpoToken
        )
      })
    )
  })

  it('Should fail with MissingCommonHeadersError when headers are missing', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

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
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
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
