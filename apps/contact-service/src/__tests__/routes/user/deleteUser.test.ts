import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'

describe('delete user', () => {
  it('Should delete user and its contacts from the db', async () => {
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
                firebaseToken: null,
                expoToken: Schema.decodeSync(ExpoNotificationTokenE)(
                  'someToken'
                ),
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

        yield* _(app.deleteUser({}, HttpClientRequest.setHeaders(authHeaders)))
        const sql = yield* _(SqlClient.SqlClient)
        const dataFromUsers = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)

        expect(dataFromUsers).toHaveLength(0)

        const dataFromContacts = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${yield* _(hashPhoneNumber(phoneNumber))}
        `)

        expect(dataFromContacts).toHaveLength(0)
      })
    )
  })
  it('Should not fail when user does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const keys = generatePrivateKey()
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420733333332')

        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )

        const result = yield* _(
          app.deleteUser({}, HttpClientRequest.setHeaders(authHeaders)),
          Effect.either
        )
        expect(result).toHaveProperty('_tag', 'Right')
      })
    )
  })
})
