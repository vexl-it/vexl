import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect} from 'effect'
import {NodeTestingApp} from '../../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../runPromiseInMockedEnvironment'

import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'

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
        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: Schema.decodeSync(FcmTokenE)('someToken'),
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
        expect(result[0]).toHaveProperty('firebaseToken', 'someToken')
        expect(result[0]).toHaveProperty('clientVersion', 1)
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
        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: Schema.decodeSync(FcmTokenE)('someToken'),
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

        yield* _(
          app.importContacts(
            {
              body: {
                contacts: [Schema.decodeSync(HashedPhoneNumberE)('someHash')],
                replace: true,
              },
            },
            HttpClientRequest.setHeaders({
              ...authHeaders,
            })
          )
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
        yield* _(
          app.createUser(
            {
              body: {
                firebaseToken: Schema.decodeSync(FcmTokenE)('someToken'),
              },
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders({
              ...authHeaders2,
            })
          )
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
