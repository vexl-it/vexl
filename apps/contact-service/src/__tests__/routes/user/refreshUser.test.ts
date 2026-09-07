import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {SqlClient} from 'effect/unstable/sql'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from '../../utils/mockEnqueueUserNotification'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

const commonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      const app = yield* NodeTestingApp

      const authHeaders = yield* createDummyAuthHeadersForUser({
        phoneNumber,
        publicKey: keys.publicKeyPemBase64,
      })
      yield* setAuthHeaders(authHeaders)

      const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
        () => ({
          publicKey: authHeaders['public-key'],
          hash: authHeaders.hash,
          signature: authHeaders.signature,
        }),
        commonHeaders
      )

      yield* app.User.createUser({
        payload: {
          firebaseToken: null,
          expoToken: Schema.decodeSync(ExpoNotificationToken)('someToken'),
          vexlNotificationToken: Option.some(
            Schema.decodeSync(VexlNotificationToken)('vexl_nt_test')
          ),
          publicKeyV2: Option.none(),
        },
        headers: commonAndSecurityHeaders,
      })
    })
  )
})
describe('Refresh user', () => {
  it('Refreshses user in database (refreshedAt clientVersion, and countryPrefix)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        mockedReportMetric.mockClear()
        const sql = yield* SqlClient.SqlClient
        yield* sql`
          UPDATE users
          SET
            refreshed_at = CURRENT_DATE - 180,
            client_version = NULL,
            country_prefix = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/2 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"Some test123", "versionCode": 2, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false, "prefix": 420}',
        })

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          testCommonHeaders
        )

        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.none(),
          },
          headers: commonAndSecurityHeaders,
        })

        const userInDb = yield* sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `
        expect(userInDb[0]).toHaveProperty('clientVersion', 2)
        expect(userInDb[0]).toHaveProperty('refreshedAt', expect.any(Date))
        expect(userInDb[0]).toHaveProperty('appSource', 'Some test123')
        expect(userInDb[0]).toHaveProperty('countryPrefix', 420)
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'USER_REFRESH',
            attributes: {
              appVersion: '1.0.0',
              appVersionCode: 2,
              appPlatform: 'ANDROID',
              appSource: 'Some test123',
              clientCountryPrefix: 420,
            },
          })
        )
      })
    )
  })
  it('Updates vexlNotificationToken when provided', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          commonHeaders
        )

        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.some(
              'vexl_nt_refreshed' as VexlNotificationToken
            ),
          },
          headers: commonAndSecurityHeaders,
        })

        const sql = yield* SqlClient.SqlClient
        const userInDb = yield* sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `
        expect(userInDb[0]).toHaveProperty(
          'vexlNotificationToken',
          'vexl_nt_refreshed'
        )
      })
    )
  })

  it('Sets vexlNotificationToken to null when not provided', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient

        // First set a token directly in DB
        yield* sql`
          UPDATE users
          SET
            vexl_notification_token = 'vexl_nt_existing'
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          commonHeaders
        )

        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.none(),
          },
          headers: commonAndSecurityHeaders,
        })

        const userInDb = yield* sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `
        expect(userInDb[0]).toHaveProperty('vexlNotificationToken', null)
      })
    )
  })

  it('Returns userNotFound error when user does not exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333334'),
          publicKey: generatePrivateKey().publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/2 (1.0.0) ANDROID',
        })

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          testCommonHeaders
        )

        const result = yield* pipe(
          app.User.refreshUser({
            payload: {
              offersAlive: true,
              vexlNotificationToken: Option.none(),
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )
        expectErrorResponse(UserNotFoundError)(result)
      })
    )
  })

  it('Notifies contacts when user transitions from inactive to active', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        const app = yield* NodeTestingApp
        const firstUserAuthHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })

        const secondUserKeys = generatePrivateKey()
        const secondUserPhoneNumber =
          Schema.decodeSync(E164PhoneNumber)('+420733333335')
        const secondUserAuthHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber: secondUserPhoneNumber,
          publicKey: secondUserKeys.publicKeyPemBase64,
        })

        const secondUserHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: secondUserAuthHeaders['public-key'],
            hash: secondUserAuthHeaders.hash,
            signature: secondUserAuthHeaders.signature,
          }),
          commonHeaders
        )

        yield* setAuthHeaders(secondUserAuthHeaders)
        yield* app.User.createUser({
          payload: {
            firebaseToken: null,
            expoToken: null,
            vexlNotificationToken: Option.some(
              Schema.decodeSync(VexlNotificationToken)(
                'vexl_nt_refresh_contact'
              )
            ),
            publicKeyV2: Option.none(),
          },
          headers: secondUserHeaders,
        })

        const firstUserHashedPhoneNumber = yield* hashPhoneNumber(phoneNumber)
        const secondUserHashedPhoneNumber = yield* hashPhoneNumber(
          secondUserPhoneNumber
        )

        const firstUserHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: keys.publicKeyPemBase64,
            hash: firstUserAuthHeaders.hash,
            signature: firstUserAuthHeaders.signature,
          }),
          commonHeaders
        )

        yield* setAuthHeaders(firstUserAuthHeaders)
        yield* app.Contact.importContacts({
          payload: {
            contacts: [secondUserHashedPhoneNumber],
            replace: true,
          },
          headers: firstUserHeaders,
        })

        yield* setAuthHeaders(secondUserAuthHeaders)
        yield* app.Contact.importContacts({
          payload: {
            contacts: [firstUserHashedPhoneNumber],
            replace: true,
          },
          headers: secondUserHeaders,
        })

        yield* sql`
          UPDATE users
          SET
            refreshed_at = CURRENT_DATE - 180
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `

        yield* clearEnqueuedNotifications
        mockedReportMetric.mockClear()
        yield* setAuthHeaders(firstUserAuthHeaders)
        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.none(),
          },
          headers: firstUserHeaders,
        })
        yield* Effect.sleep(200)

        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'USER_REACTIVATED',
            attributes: {
              appVersion: '1.0.0',
              appVersionCode: 1,
              appPlatform: 'ANDROID',
              appSource: 'unknown',
              clientCountryPrefix: 'none',
              daysInactive: 180,
              remindersReceived: 0,
              daysSinceLastReminder: 'none',
            },
          })
        )

        const notifications = yield* getEnqueuedNotifications
        const newUserNotifications = notifications.filter(
          (one) =>
            one.task._tag === 'NewUserNotificationMqEntry' &&
            one.task.token === 'vexl_nt_refresh_contact'
        )

        expect(newUserNotifications.length).toBeGreaterThan(0)
      })
    )
  })

  it('Reports USER_REACTIVATED for a reminded user below the metrics window', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`
          UPDATE users
          SET
            refreshed_at = CURRENT_DATE - 10,
            number_of_inactivity_notifications_sent = 2,
            last_inactivity_notification_sent_at = now() - INTERVAL '3 days'
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          commonHeaders
        )

        mockedReportMetric.mockClear()
        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.none(),
          },
          headers: commonAndSecurityHeaders,
        })
        yield* Effect.sleep(200)

        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'USER_REACTIVATED',
            attributes: expect.objectContaining({
              daysInactive: 10,
              remindersReceived: 2,
              daysSinceLastReminder: 3,
            }),
          })
        )
      })
    )
  })

  it('Does not report USER_REACTIVATED for a recently active user without reminders', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`
          UPDATE users
          SET
            refreshed_at = CURRENT_DATE - 10,
            number_of_inactivity_notifications_sent = 0,
            last_inactivity_notification_sent_at = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `

        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: authHeaders['public-key'],
            hash: authHeaders.hash,
            signature: authHeaders.signature,
          }),
          commonHeaders
        )

        mockedReportMetric.mockClear()
        yield* app.User.refreshUser({
          payload: {
            offersAlive: true,
            vexlNotificationToken: Option.none(),
          },
          headers: commonAndSecurityHeaders,
        })
        yield* Effect.sleep(200)

        expect(mockedReportMetric).not.toHaveBeenCalledWith(
          expect.objectContaining({name: 'USER_REACTIVATED'})
        )
      })
    )
  })
})
