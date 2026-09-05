import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

describe('updateNotificationToken (no-op kept for old clients)', () => {
  it('Returns success and leaves the stored token untouched', async () => {
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
              vexlNotificationToken: Option.some(
                Schema.decodeSync(VexlNotificationToken)('vexl_nt_test')
              ),
              publicKeyV2: Option.none(),
            },
            headers: commonAndSecurityHeaders,
          })
        )

        yield* _(
          app.User.updateNotificationToken({headers: commonAndSecurityHeaders})
        )

        const sql = yield* _(SqlClient.SqlClient)
        const userInDb = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${keys.publicKeyPemBase64}
        `)
        expect(userInDb[0]).toHaveProperty(
          'vexlNotificationToken',
          'vexl_nt_test'
        )
      })
    )
  })

  it('Returns success even when the user does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333334'),
            publicKey: generatePrivateKey().publicKeyPemBase64,
          })
        )
        yield* _(setAuthHeaders(authHeaders))

        yield* _(
          app.User.updateNotificationToken({
            headers: makeTestCommonAndSecurityHeaders(authHeaders),
          })
        )
      })
    )
  })
})
