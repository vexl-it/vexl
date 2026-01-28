import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from '../../utils/mockEnqueueUserNotification'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const app = yield* _(NodeTestingApp)

      const authHeaders = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
      )
      yield* _(setAuthHeaders(authHeaders))

      const commonAndSecurityHeaders =
        makeTestCommonAndSecurityHeaders(authHeaders)

      yield* _(
        app.User.createUser({
          payload: {
            firebaseToken: null,
            expoToken: Schema.decodeSync(ExpoNotificationToken)(
              'notificationToken'
            ),
            vexlNotificationToken: Option.some(
              Schema.decodeSync(VexlNotificationToken)('vexl_nt_test')
            ),
          },
          headers: commonAndSecurityHeaders,
        })
      )
    })
  )
})

describe('Check user exists', () => {
  it('Should return false when user does not exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const keys = generatePrivateKey()
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333334'),
            publicKey: keys.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: false},
            headers: commonAndSecurityHeaders,
          })
        )

        expect(result.exists).toBe(false)
      })
    )
  })
  it('Should return true when user does exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: false},
            headers: commonAndSecurityHeaders,
          })
        )
        expect(result.exists).toBe(true)
      })
    )
  })
})

describe('Check user exist notification', () => {
  beforeEach(async () => {
    await runPromiseInMockedEnvironment(clearEnqueuedNotifications)
  })

  it('Should enqueue VexlNotificationToken notification when user has vexlNotificationToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(clearEnqueuedNotifications)

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            vexl_notification_token = ${'vexl_nt_login_test' as VexlNotificationToken}
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)

        const app = yield* _(NodeTestingApp)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: true},
            headers: commonAndSecurityHeaders,
          })
        )

        expect(result.exists).toBe(true)

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)
        const loginNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'UserLoginOnDifferentDeviceNotificationMqEntry'
        )

        expect(loginNotifications).toHaveLength(1)
        expect(
          loginNotifications[0]?.task._tag ===
            'UserLoginOnDifferentDeviceNotificationMqEntry'
            ? loginNotifications[0].task.token
            : ''
        ).toBe('vexl_nt_login_test')

        // Clean up: remove vexl_notification_token
        yield* _(sql`
          UPDATE users
          SET
            vexl_notification_token = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)
      })
    )
  })

  it('Should enqueue notification with legacy expoToken when user has no vexlNotificationToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(clearEnqueuedNotifications)

        const sql = yield* _(SqlClient.SqlClient)

        // Ensure user has ONLY expoToken (no vexlNotificationToken)
        yield* _(sql`
          UPDATE users
          SET
            vexl_notification_token = NULL,
            expo_token = ${'expo_legacy_token' as ExpoNotificationToken}
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)

        const app = yield* _(NodeTestingApp)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: true},
            headers: commonAndSecurityHeaders,
          })
        )

        expect(result.exists).toBe(true)

        yield* _(Effect.sleep('100 millis'))

        const enqueuedNotifications = yield* _(getEnqueuedNotifications)
        const loginNotifications = enqueuedNotifications.filter(
          (n) => n.task._tag === 'UserLoginOnDifferentDeviceNotificationMqEntry'
        )

        expect(loginNotifications).toHaveLength(1)

        const notification = loginNotifications[0]
        if (
          notification?.task._tag ===
          'UserLoginOnDifferentDeviceNotificationMqEntry'
        ) {
          // vexlNotificationToken should be null
          expect(notification.task.token).toBeNull()
          // expoToken should be set
          expect(notification.task.notificationToken).toBe('expo_legacy_token')
        }
      })
    )
  })
})
