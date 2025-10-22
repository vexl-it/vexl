import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420733333333')

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
      yield* _(
        app.User.createUser({
          payload: {
            firebaseToken: null,
            expoToken: Schema.decodeSync(ExpoNotificationTokenE)('someToken'),
          },
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          }),
        })
      )
    })
  )
})
describe('Refresh user', () => {
  it('Refreshses user in database (refreshedAt clientVersion, and countryPrefix)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = NULL,
            client_version = NULL,
            country_prefix = NULL
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
        yield* _(
          app.User.refreshUser({
            payload: {
              offersAlive: true,
              countryPrefix: Option.some(
                Schema.decodeSync(CountryPrefixE)(420)
              ),
            },
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"Some test123", "versionCode": 2, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
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
        expect(userInDb[0]).toHaveProperty('clientVersion', 2)
        expect(userInDb[0]).toHaveProperty('refreshedAt', expect.any(Date))
        expect(userInDb[0]).toHaveProperty('countryPrefix', 420)
        expect(userInDb[0]).toHaveProperty('appSource', 'Some test123')
      })
    )
  })
  it('Returns userNotFound error when user does not exists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333334'),
            publicKey: generatePrivateKey().publicKeyPemBase64,
          })
        )
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(authHeaders))
        const result = yield* _(
          app.User.refreshUser({
            payload: {
              offersAlive: true,
              countryPrefix: Option.none(),
            },
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) ANDROID',
            }),
          }),
          Effect.either
        )
        expectErrorResponse(UserNotFoundError)(result)
      })
    )
  })
})
