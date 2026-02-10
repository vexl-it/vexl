import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

describe('delete user', () => {
  it('Should delete user and its contacts from the db', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const keys = generatePrivateKey()
        const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

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
              publicKeyV2: Option.none(),
            },
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: [Schema.decodeSync(HashedPhoneNumber)('someHash')],
              replace: true,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(app.User.deleteUser({headers: commonAndSecurityHeaders}))
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
        const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333332')

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
          app.User.deleteUser({headers: commonAndSecurityHeaders}),
          Effect.either
        )
        expect(result).toHaveProperty('_tag', 'Right')
      })
    )
  })
})
