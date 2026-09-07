import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {SqlClient} from 'effect/unstable/sql'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      const app = yield* NodeTestingApp

      const authHeaders = yield* createDummyAuthHeadersForUser({
        phoneNumber,
        publicKey: keys.publicKeyPemBase64,
      })
      yield* setAuthHeaders(authHeaders)

      const commonAndSecurityHeaders =
        makeTestCommonAndSecurityHeaders(authHeaders)

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

describe('updateExpoToken', () => {
  it('Updates expo token in database', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`
          UPDATE users
          SET
            expo_token = NULL
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: keys.publicKeyPemBase64,
        })
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(authHeaders)
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          authHeaders,
          Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) ANDROID',
          })
        )
        yield* app.User.updateNotificationToken({
          payload: {
            expoToken: Schema.decodeSync(ExpoNotificationToken)('newToken'),
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
        expect(userInDb[0]).toHaveProperty('expoToken', 'newToken')
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          authHeaders,
          Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) ANDROID',
          })
        )
        const result = yield* pipe(
          app.User.updateNotificationToken({
            payload: {
              expoToken: Schema.decodeSync(ExpoNotificationToken)('newToken'),
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.result
        )
        expectErrorResponse(UserNotFoundError)(result)
      })
    )
  })
})
