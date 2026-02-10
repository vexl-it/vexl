import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {sendNotificationsMock} from '../../utils/mockedExpoNotificationService'
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
            publicKeyV2: Option.none(),
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
  beforeEach(() => {
    sendNotificationsMock.mockClear()
  })
  it('Should issue notification when user exists, has fcmToken and notifyExistingUserAboutLogin is true', async () => {
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
            urlParams: {notifyExistingUserAboutLogin: true},
            headers: commonAndSecurityHeaders,
          })
        )
        expect(result.exists).toBe(true)

        const call = sendNotificationsMock.mock.calls[0][0]

        expect(call.length).toEqual(1)
        expect(call[0].data?.type).toEqual('LOGGING_ON_DIFFERENT_DEVICE')
        expect(call[0].to).toEqual('notificationToken')
      })
    )
  })
  it('Should not sent notificatin when user does not exist', async () => {
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

        yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: true},
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(Effect.sleep(100))
        expect(sendNotificationsMock).not.toHaveBeenCalled()
      })
    )
  })

  it('Should not sent notification when fcm token not set', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            expo_token = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const result = yield* _(
          app.User.checkUserExists({
            urlParams: {notifyExistingUserAboutLogin: true},
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(sql`
          UPDATE users
          SET
            expo_token = 'someToken'
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)

        expect(result.exists).toBe(true)

        yield* _(Effect.sleep(100))
        expect(sendNotificationsMock).not.toHaveBeenCalled()
      })
    )
  })
  it('Should not sent notificatin when notifyExistingUserAboutLogin is false', async () => {
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

        yield* _(Effect.sleep(100))
        expect(sendNotificationsMock).not.toHaveBeenCalled()
      })
    )
  })
})
