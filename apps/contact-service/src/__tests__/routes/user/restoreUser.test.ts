import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateLoginSessionId,
  type LoginSessionId,
} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  LoggedInOnAnotherDeviceError,
  UserNotFoundError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {serverHashPhoneNumber} from '../../../utils/serverHashContact'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

type KeyPair = ReturnType<typeof generatePrivateKey>

const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333399')
const oldDeviceToken = Schema.decodeSync(VexlNotificationToken)('vexl_nt_old')
const newDeviceToken = Schema.decodeSync(VexlNotificationToken)('vexl_nt_new')
const newDeviceExpoToken = Schema.decodeSync(ExpoNotificationToken)(
  'newExpoToken'
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const loginAs = (keys: KeyPair) =>
  Effect.gen(function* (_) {
    const authHeaders = yield* _(
      createDummyAuthHeadersForUser({
        phoneNumber,
        publicKey: keys.publicKeyPemBase64,
      })
    )
    yield* _(setAuthHeaders(authHeaders))
    return makeTestCommonAndSecurityHeaders(authHeaders)
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createUser = (keys: KeyPair, loginSessionId?: LoginSessionId) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const headers = yield* _(loginAs(keys))
    yield* _(
      app.User.createUser({
        payload: {
          firebaseToken: null,
          expoToken: Schema.decodeSync(ExpoNotificationToken)('oldExpoToken'),
          vexlNotificationToken: Option.some(oldDeviceToken),
          publicKeyV2: Option.none(),
          loginSessionId,
        },
        headers,
      })
    )
    return headers
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const refreshUser = (keys: KeyPair, loginSessionId?: LoginSessionId) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    return yield* _(
      app.User.refreshUser({
        payload: {
          offersAlive: true,
          vexlNotificationToken: Option.none(),
          loginSessionId,
        },
        headers: yield* _(loginAs(keys)),
      }),
      Effect.either
    )
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const restoreUser = (keys: KeyPair, loginSessionId: LoginSessionId) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    return yield* _(
      app.User.restoreUser({
        payload: {
          loginSessionId,
          vexlNotificationToken: Option.some(newDeviceToken),
          expoToken: Option.some(newDeviceExpoToken),
        },
        headers: yield* _(loginAs(keys)),
      }),
      Effect.either
    )
  })

const findUserRow = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const serverHash = yield* _(
    hashPhoneNumber(phoneNumber),
    Effect.flatMap(serverHashPhoneNumber)
  )
  const rows = yield* _(sql`
    SELECT
      *
    FROM
      users
    WHERE
      hash = ${serverHash}
  `)
  return {row: rows[0], serverHash}
})

describe('Login session and restore user', () => {
  afterEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM user_contact`)
        yield* _(sql`DELETE FROM users`)
      })
    )
  })

  it('Stores login session id on createUser', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const loginSessionId = generateLoginSessionId()
        yield* _(createUser(generatePrivateKey(), loginSessionId))

        const {row} = yield* _(findUserRow)
        expect(row).toHaveProperty('loginSessionId', loginSessionId)
      })
    )
  })

  it('Fails refresh with LoggedInOnAnotherDeviceError when the login session differs', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        const loginSessionId = generateLoginSessionId()
        yield* _(createUser(keys, loginSessionId))

        const sameSession = yield* _(refreshUser(keys, loginSessionId))
        expect(sameSession._tag).toBe('Right')

        const withoutSession = yield* _(refreshUser(keys))
        expect(withoutSession._tag).toBe('Right')

        const otherSession = yield* _(
          refreshUser(keys, generateLoginSessionId())
        )
        expectErrorResponse(LoggedInOnAnotherDeviceError)(otherSession)
      })
    )
  })

  it('Adopts the login session sent by a user created without one', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        const loginSessionId = generateLoginSessionId()
        yield* _(createUser(keys))

        const adopted = yield* _(refreshUser(keys, loginSessionId))
        expect(adopted._tag).toBe('Right')
        const {row} = yield* _(findUserRow)
        expect(row).toHaveProperty('loginSessionId', loginSessionId)

        const otherSession = yield* _(
          refreshUser(keys, generateLoginSessionId())
        )
        expectErrorResponse(LoggedInOnAnotherDeviceError)(otherSession)
      })
    )
  })

  it('Restores user without touching contacts and kicks out the old device', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)
        const keys = generatePrivateKey()
        const oldDeviceSession = generateLoginSessionId()
        const headers = yield* _(createUser(keys, oldDeviceSession))
        yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: [Schema.decodeSync(HashedPhoneNumber)('someHash')],
              replace: true,
            },
            headers,
          })
        )

        const newDeviceSession = generateLoginSessionId()
        const restored = yield* _(restoreUser(keys, newDeviceSession))
        expect(restored._tag).toBe('Right')

        const {row, serverHash} = yield* _(findUserRow)
        expect(row).toHaveProperty('publicKey', keys.publicKeyPemBase64)
        expect(row).toHaveProperty('loginSessionId', newDeviceSession)
        expect(row).toHaveProperty('vexlNotificationToken', newDeviceToken)
        expect(row).toHaveProperty('expoToken', newDeviceExpoToken)

        const contacts = yield* _(sql`
          SELECT
            *
          FROM
            user_contact
          WHERE
            hash_from = ${serverHash}
        `)
        expect(contacts).toHaveLength(1)

        const oldDeviceRefresh = yield* _(refreshUser(keys, oldDeviceSession))
        expectErrorResponse(LoggedInOnAnotherDeviceError)(oldDeviceRefresh)

        const newDeviceRefresh = yield* _(refreshUser(keys, newDeviceSession))
        expect(newDeviceRefresh._tag).toBe('Right')
      })
    )
  })

  it('Fails restore with UserNotFoundError when the account was replaced by another login', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const backedUpKeys = generatePrivateKey()
        yield* _(createUser(backedUpKeys))
        yield* _(createUser(generatePrivateKey()))

        const restored = yield* _(
          restoreUser(backedUpKeys, generateLoginSessionId())
        )
        expectErrorResponse(UserNotFoundError)(restored)
      })
    )
  })
})
