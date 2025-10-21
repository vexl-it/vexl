import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

describe('create user', () => {
  it('Should create a user in db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const keys = generatePrivateKey()
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420733333333')

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
              'vexl-app-meta':
                '{"appSource":"googlePlay", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const result = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)
        expect(result[0]).toHaveProperty('platform', 'ANDROID')
        expect(result[0]).toHaveProperty('publicKey', keys.publicKeyPemBase64)
        expect(result[0]).toHaveProperty(
          'hash',
          yield* _(hashPhoneNumber(phoneNumber))
        )
        expect(result[0]).toHaveProperty('expoToken', 'someToken')
        expect(result[0]).toHaveProperty('clientVersion', 1)
        expect(result[0]).toHaveProperty('appSource', 'googlePlay')
      })
    )
  })
  it('Should remove existing user and its contacts from db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const keys = generatePrivateKey()
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420733333333')
        const phoneNumberHash = yield* _(hashPhoneNumber(phoneNumber))
        const sql = yield* _(SqlClient.SqlClient)

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

        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: [Schema.decodeSync(HashedPhoneNumberE)('someHash')],
              replace: true,
            },
          })
        )

        const inDb = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${phoneNumberHash}
        `)
        expect(inDb[0]).toHaveProperty('hashFrom', phoneNumberHash)
        expect(inDb[0]).toHaveProperty('hashTo', 'someHash')

        const keys2 = generatePrivateKey()

        const authHeaders2 = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys2.publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders2))
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

        const result = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${phoneNumberHash}
        `)
        expect(result).toHaveLength(0)
      })
    )
  })
})
