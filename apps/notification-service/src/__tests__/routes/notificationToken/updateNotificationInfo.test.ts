import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  CommonHeaders,
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
  'ExponentPushToken[yyyyyyyyyyyyyyyyyyy]'
)
const validExpoTokenUpdate = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[zzzzzzzzzzzzzzzzzzzz]'
)
const firstDuplicateExpoToken = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[updateDuplicateFirst]'
)
const secondDuplicateExpoToken = Schema.decodeSync(ExpoNotificationToken)(
  'ExponentPushToken[updateDuplicateSecond]'
)
const validSystemVexlToken = Schema.decodeSync(VexlNotificationToken)(
  'vexl_nt_system'
)
const validMarketingVexlToken = Schema.decodeSync(VexlNotificationToken)(
  'vexl_nt_marketing'
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

        // Then update it
        const resp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
              expoNotificationToken: validExpoTokenUpdate,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
      })
    )
  })

  it('Should update client prefix and verify it is saved', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

        // First create a secret with initial prefix
        const createResp = yield* pipe(
          app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeadersWithPrefix,
          }),
          Effect.result
        )

        expect(createResp._tag).toEqual('Success')
        if (createResp._tag !== 'Success') return

        // Verify initial prefix is saved
        const initialRecord = yield* db.findSecretBySecretValue(
          createResp.success.secret
        )
        expect(Option.isSome(initialRecord)).toBe(true)
        if (Option.isNone(initialRecord)) return
        expect(initialRecord.value.clientPrefix).toEqual(validPrefix)

        // Update with new prefix
        const updateResp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
              expoNotificationToken: validExpoTokenUpdate,
            },
            headers: validHeadersWithUpdatedPrefix,
          }),
          Effect.result
        )

        expect(updateResp._tag).toEqual('Success')

        // Verify prefix was updated
        const updatedRecord = yield* db.findSecretBySecretValue(
          createResp.success.secret
        )
        expect(Option.isSome(updatedRecord)).toBe(true)
        if (Option.isNone(updatedRecord)) return
        expect(updatedRecord.value.clientPrefix).toEqual(updatedPrefix)
      })
    )
  })

  it('Should update system and marketing vexl tokens', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

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

        const updateResp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
              expoNotificationToken: validExpoTokenUpdate,
              systemVexlToken: validSystemVexlToken,
              marketingVexlToken: validMarketingVexlToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(updateResp._tag).toEqual('Success')

        const updatedRecord = yield* db.findSecretBySecretValue(
          createResp.success.secret
        )
        expect(Option.isSome(updatedRecord)).toBe(true)
        if (Option.isNone(updatedRecord)) return
        expect(updatedRecord.value.systemVexlToken).toEqual(
          validSystemVexlToken
        )
        expect(updatedRecord.value.marketingVexlToken).toEqual(
          validMarketingVexlToken
        )
      })
    )
  })

  it('Should move an expo token from another secret to the updated secret', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

        const firstResp =
          yield* app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: firstDuplicateExpoToken,
            },
            headers: validHeaders,
          })

        const secondResp =
          yield* app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: secondDuplicateExpoToken,
            },
            headers: validHeaders,
          })

        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: secondResp.secret,
            expoNotificationToken: firstDuplicateExpoToken,
          },
          headers: validHeaders,
        })

        const firstRecord = yield* db.findSecretBySecretValue(firstResp.secret)
        const secondRecord = yield* db.findSecretBySecretValue(
          secondResp.secret
        )

        expect(Option.isSome(firstRecord)).toBe(true)
        expect(Option.isSome(secondRecord)).toBe(true)
        if (Option.isNone(firstRecord) || Option.isNone(secondRecord)) return

        expect(firstRecord.value.expoNotificationToken).toBeNull()
        expect(secondRecord.value.expoNotificationToken).toEqual(
          firstDuplicateExpoToken
        )
      })
    )
  })

  it('Should clear only the current secret expo token when expo token is omitted', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

        const firstResp =
          yield* app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: firstDuplicateExpoToken,
            },
            headers: validHeaders,
          })

        const secondResp =
          yield* app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: secondDuplicateExpoToken,
            },
            headers: validHeaders,
          })

        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: secondResp.secret,
          },
          headers: validHeaders,
        })

        const firstRecord = yield* db.findSecretBySecretValue(firstResp.secret)
        const secondRecord = yield* db.findSecretBySecretValue(
          secondResp.secret
        )

        expect(Option.isSome(firstRecord)).toBe(true)
        expect(Option.isSome(secondRecord)).toBe(true)
        if (Option.isNone(firstRecord) || Option.isNone(secondRecord)) return

        expect(firstRecord.value.expoNotificationToken).toEqual(
          firstDuplicateExpoToken
        )
        expect(secondRecord.value.expoNotificationToken).toBeNull()
      })
    )
  })

  it('Should clear marketing vexl token when omitted', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

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

        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: createResp.success.secret,
            systemVexlToken: validSystemVexlToken,
            marketingVexlToken: validMarketingVexlToken,
          },
          headers: validHeaders,
        })

        const updateResp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
              systemVexlToken: validSystemVexlToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(updateResp._tag).toEqual('Success')

        const updatedRecord = yield* db.findSecretBySecretValue(
          createResp.success.secret
        )
        expect(Option.isSome(updatedRecord)).toBe(true)
        if (Option.isNone(updatedRecord)) return
        expect(updatedRecord.value.systemVexlToken).toEqual(
          validSystemVexlToken
        )
        expect(updatedRecord.value.marketingVexlToken).toBeNull()
      })
    )
  })

  it('Should clear system vexl token when omitted', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

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

        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: createResp.success.secret,
            systemVexlToken: validSystemVexlToken,
            marketingVexlToken: validMarketingVexlToken,
          },
          headers: validHeaders,
        })

        const updateResp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
              marketingVexlToken: validMarketingVexlToken,
            },
            headers: validHeaders,
          }),
          Effect.result
        )

        expect(updateResp._tag).toEqual('Success')

        const updatedRecord = yield* db.findSecretBySecretValue(
          createResp.success.secret
        )
        expect(Option.isSome(updatedRecord)).toBe(true)
        if (Option.isNone(updatedRecord)) return
        expect(updatedRecord.value.systemVexlToken).toBeNull()
        expect(updatedRecord.value.marketingVexlToken).toEqual(
          validMarketingVexlToken
        )
      })
    )
  })

  it('Should save background socket enabled and default it to false when omitted', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const db = yield* NotificationTokensDb

        const createResp =
          yield* app.NotificationTokenGroup.CreateNotificationSecret({
            payload: {
              expoNotificationToken: validExpoToken,
            },
            headers: validHeaders,
          })

        const initialRecord = yield* db.findSecretBySecretValue(
          createResp.secret
        )
        expect(Option.isSome(initialRecord)).toBe(true)
        if (Option.isNone(initialRecord)) return
        expect(initialRecord.value.backgroundSocketEnabled).toBe(false)

        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: createResp.secret,
            backgroundSocketEnabled: true,
          },
          headers: validHeaders,
        })

        const enabledRecord = yield* db.findSecretBySecretValue(
          createResp.secret
        )
        expect(Option.isSome(enabledRecord)).toBe(true)
        if (Option.isNone(enabledRecord)) return
        expect(enabledRecord.value.backgroundSocketEnabled).toBe(true)

        // Omitting the field means the client does not use the background socket
        yield* app.NotificationTokenGroup.updateNoficationInfo({
          payload: {
            secret: createResp.secret,
          },
          headers: validHeaders,
        })

        const disabledRecord = yield* db.findSecretBySecretValue(
          createResp.secret
        )
        expect(Option.isSome(disabledRecord)).toBe(true)
        if (Option.isNone(disabledRecord)) return
        expect(disabledRecord.value.backgroundSocketEnabled).toBe(false)
      })
    )
  })

  it('Should fail with MissingCommonHeadersError when headers are missing', async () => {
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

        const resp = yield* pipe(
          app.NotificationTokenGroup.updateNoficationInfo({
            payload: {
              secret: createResp.success.secret,
            },
            headers: headersWithoutVexlMeta,
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Failure')
      })
    )
  })
})
