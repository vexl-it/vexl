import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
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
            expoToken: Schema.decodeSync(ExpoNotificationToken)('someToken'),
          },
          headers: commonAndSecurityHeaders,
        })
      )
    })
  )
})

describe('updateExpoToken', () => {
  it('Updates expo token in database', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            expo_token = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          authHeaders,
          Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) ANDROID',
          })
        )
        yield* _(
          app.User.updateNotificationToken({
            payload: {
              expoToken: Schema.decodeSync(ExpoNotificationToken)('newToken'),
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const userInDb = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)
        expect(userInDb[0]).toHaveProperty('expoToken', 'newToken')
      })
    )
  })
  it('Returns userNotFound error when user does not exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333334'),
            publicKey: generatePrivateKey().publicKeyPemBase64,
          })
        )
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          authHeaders,
          Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) ANDROID',
          })
        )
        const result = yield* _(
          app.User.updateNotificationToken({
            payload: {
              expoToken: Schema.decodeSync(ExpoNotificationToken)('newToken'),
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )
        expectErrorResponse(UserNotFoundError)(result)
      })
    )
  })
})
