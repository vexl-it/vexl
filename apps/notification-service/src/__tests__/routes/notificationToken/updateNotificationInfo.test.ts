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
  'ExponentPushToken[yyyyyyyyyyyyyyyyyyy]'
)
const validExpoTokenUpdate = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[zzzzzzzzzzzzzzzzzzzz]'
)

const validPrefix = Schema.decodeSync(CountryPrefix)(420)
const updatedPrefix = Schema.decodeSync(CountryPrefix)(1)

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

const validHeadersWithUpdatedPrefix = makeCommonHeaders({
  platform: 'ANDROID',
  versionCode: validVersionCode,
  semver: validSemver,
  appSource: validAppSource,
  language: 'en',
  isDeveloper: false,
  deviceModel: Option.none(),
  osVersion: Option.none(),
  prefix: Option.some(updatedPrefix),
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

  it('Should update client prefix and verify it is saved', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const db = yield* _(NotificationTokensDb)

        // First create a secret with initial prefix
        const createResp = yield* _(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeadersWithPrefix,
          }),
          Effect.either
        )

        expect(createResp._tag).toEqual('Right')
        if (createResp._tag !== 'Right') return

        // Verify initial prefix is saved
        const initialRecord = yield* _(
          db.findSecretBySecretValue(createResp.right.secret)
        )
        expect(Option.isSome(initialRecord)).toBe(true)
        if (Option.isNone(initialRecord)) return
        expect(initialRecord.value.clientPrefix).toEqual(validPrefix)

        // Update with new prefix
        const updateResp = yield* _(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.right.secret,
              expoNotificationToken: validExpoTokenUpdate,
            },
            headers: validHeadersWithUpdatedPrefix,
          }),
          Effect.either
        )

        expect(updateResp._tag).toEqual('Right')

        // Verify prefix was updated
        const updatedRecord = yield* _(
          db.findSecretBySecretValue(createResp.right.secret)
        )
        expect(Option.isSome(updatedRecord)).toBe(true)
        if (Option.isNone(updatedRecord)) return
        expect(updatedRecord.value.clientPrefix).toEqual(updatedPrefix)
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
