import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'

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
      yield* _(
        app.createUser(
          {
            body: {
              firebaseToken: null,
              expoToken: Schema.decodeSync(ExpoNotificationTokenE)('someToken'),
            },
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          },
          HttpClientRequest.setHeaders({
            ...authHeaders,
          })
        )
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
        yield* _(
          app.refreshUser(
            {
              body: {
                offersAlive: true,
                countryPrefix: Option.some(
                  Schema.decodeSync(CountryPrefixE)(420)
                ),
              },
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders(authHeaders)
          )
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
        const result = yield* _(
          app.refreshUser(
            {
              body: {
                offersAlive: true,
                countryPrefix: Option.none(),
              },
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders(authHeaders)
          ),
          Effect.either
        )
        expect(result._tag).toBe('Left')
        if (result._tag !== 'Left') return
        expect(result.left.error).toHaveProperty('_tag', 'UserNotFoundError')
      })
    )
  })
})
