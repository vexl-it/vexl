import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateLoginSessionId,
  type LoginSessionId,
} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
  loginSessionProofMessage,
  UserNotFoundError,
  type LoginSessionProof,
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

type ProofOf = (
  loginSessionId: LoginSessionId
) => Effect.Effect<LoginSessionProof | undefined, CryptoError>

const signedBy =
  (keys: KeyPair, signedAt = unixMillisecondsNow()): ProofOf =>
  (loginSessionId) =>
    ecdsaSignE(keys.privateKeyPemBase64)(
      loginSessionProofMessage({loginSessionId, signedAt})
    ).pipe(Effect.map((signature) => ({signedAt, signature})))

const proofFor = (
  loginSessionId: LoginSessionId | undefined,
  proofOf: ProofOf
): Effect.Effect<LoginSessionProof | undefined, CryptoError> =>
  loginSessionId === undefined
    ? Effect.succeed(undefined)
    : proofOf(loginSessionId)

/* eslint-disable @typescript-eslint/explicit-function-return-type */
const createUserEither = (
  keys: KeyPair,
  loginSessionId?: LoginSessionId,
  proofOf: ProofOf = signedBy(keys)
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const headers = yield* _(loginAs(keys))
    const loginSessionProof = yield* _(proofFor(loginSessionId, proofOf))
    return yield* _(
      app.User.createUser({
        payload: {
          vexlNotificationToken: Option.some(oldDeviceToken),
          publicKeyV2: Option.none(),
          loginSessionId,
          loginSessionProof,
        },
        headers,
      }),
      Effect.as(headers),
      Effect.either
    )
  })
/* eslint-enable @typescript-eslint/explicit-function-return-type */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createUser = (keys: KeyPair, loginSessionId?: LoginSessionId) =>
  Effect.flatten(createUserEither(keys, loginSessionId))

/* eslint-disable @typescript-eslint/explicit-function-return-type */
const refreshUser = (
  keys: KeyPair,
  loginSessionId?: LoginSessionId,
  proofOf: ProofOf = signedBy(keys)
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const loginSessionProof = yield* _(proofFor(loginSessionId, proofOf))
    return yield* _(
      app.User.refreshUser({
        payload: {
          offersAlive: true,
          vexlNotificationToken: Option.none(),
          loginSessionId,
          loginSessionProof,
        },
        headers: yield* _(loginAs(keys)),
      }),
      Effect.either
    )
  })
/* eslint-enable @typescript-eslint/explicit-function-return-type */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
const restoreUser = (
  keys: KeyPair,
  loginSessionId: LoginSessionId,
  proofOf: ProofOf = signedBy(keys)
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const loginSessionProof = yield* _(proofOf(loginSessionId))
    if (!loginSessionProof)
      return yield* _(Effect.dieMessage('restoreUser needs a proof'))
    return yield* _(
      app.User.restoreUser({
        payload: {
          loginSessionId,
          loginSessionProof,
          vexlNotificationToken: Option.some(newDeviceToken),
        },
        headers: yield* _(loginAs(keys)),
      }),
      Effect.either
    )
  })
/* eslint-enable @typescript-eslint/explicit-function-return-type */

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

describe('Login session proof', () => {
  afterEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM user_contact`)
        yield* _(sql`DELETE FROM users`)
      })
    )
  })

  const elevenMinutesAgo = (): UnixMilliseconds =>
    Schema.decodeSync(UnixMilliseconds)(unixMillisecondsNow() - 11 * 60 * 1000)
  const noProof: ProofOf = () => Effect.succeed(undefined)

  it.each([
    ['missing', (): ProofOf => noProof],
    ['by another key', (): ProofOf => signedBy(generatePrivateKey())],
    ['stale', (keys: KeyPair): ProofOf => signedBy(keys, elevenMinutesAgo())],
  ])(
    'Rejects a login session id with a %s proof on createUser and refreshUser',
    async (_, proofOf) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const keys = generatePrivateKey()
          const loginSessionId = generateLoginSessionId()

          const created = yield* _(
            createUserEither(keys, loginSessionId, proofOf(keys))
          )
          expectErrorResponse(InvalidLoginSessionProofError)(created)

          yield* _(createUser(keys))
          const refreshed = yield* _(
            refreshUser(keys, loginSessionId, proofOf(keys))
          )
          expectErrorResponse(InvalidLoginSessionProofError)(refreshed)
          const {row} = yield* _(findUserRow)
          expect(row).toHaveProperty('loginSessionId', null)
        })
      )
    }
  )

  it.each([
    ['by another key', (): ProofOf => signedBy(generatePrivateKey())],
    ['stale', (keys: KeyPair): ProofOf => signedBy(keys, elevenMinutesAgo())],
  ])(
    'Rejects restoreUser with a proof %s and keeps the old login session',
    async (_, proofOf) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const keys = generatePrivateKey()
          const oldDeviceSession = generateLoginSessionId()
          yield* _(createUser(keys, oldDeviceSession))

          const restored = yield* _(
            restoreUser(keys, generateLoginSessionId(), proofOf(keys))
          )
          expectErrorResponse(InvalidLoginSessionProofError)(restored)
          const {row} = yield* _(findUserRow)
          expect(row).toHaveProperty('loginSessionId', oldDeviceSession)
        })
      )
    }
  )

  const captured =
    (proof: LoginSessionProof): ProofOf =>
    () =>
      Effect.succeed(proof)
  const signNow = (
    keys: KeyPair,
    loginSessionId: LoginSessionId
  ): Effect.Effect<LoginSessionProof, CryptoError> =>
    signedBy(keys)(loginSessionId).pipe(
      Effect.flatMap(Effect.fromNullable),
      Effect.orDie
    )

  it('Rejects a proof replayed to restoreUser after another device restored', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        const deviceASession = generateLoginSessionId()
        yield* _(createUser(keys, deviceASession))
        const deviceAProof = yield* _(signNow(keys, deviceASession))
        const refreshed = yield* _(
          refreshUser(keys, deviceASession, captured(deviceAProof))
        )
        expect(refreshed._tag).toBe('Right')

        const deviceBSession = generateLoginSessionId()
        const restored = yield* _(restoreUser(keys, deviceBSession))
        expect(restored._tag).toBe('Right')

        const replayed = yield* _(
          restoreUser(keys, deviceASession, captured(deviceAProof))
        )
        expectErrorResponse(InvalidLoginSessionProofError)(replayed)
        const {row} = yield* _(findUserRow)
        expect(row).toHaveProperty('loginSessionId', deviceBSession)
      })
    )
  })

  it('Accepts a proof only once on the same route', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        yield* _(createUser(keys, generateLoginSessionId()))
        const restoredSession = generateLoginSessionId()
        const proof = yield* _(signNow(keys, restoredSession))

        const first = yield* _(
          restoreUser(keys, restoredSession, captured(proof))
        )
        expect(first._tag).toBe('Right')
        const second = yield* _(
          restoreUser(keys, restoredSession, captured(proof))
        )
        expectErrorResponse(InvalidLoginSessionProofError)(second)
      })
    )
  })

  it('Rejects a replayed proof adopting a login session on a row without one', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        const keys = generatePrivateKey()
        yield* _(createUser(keys))
        const loginSessionId = generateLoginSessionId()
        const proof = yield* _(signNow(keys, loginSessionId))
        const adopted = yield* _(
          refreshUser(keys, loginSessionId, captured(proof))
        )
        expect(adopted._tag).toBe('Right')
        // As after a later login of a client without login sessions
        yield* _(sql`
          UPDATE users
          SET
            login_session_id = NULL
        `)

        const replayed = yield* _(
          refreshUser(keys, loginSessionId, captured(proof))
        )
        expectErrorResponse(InvalidLoginSessionProofError)(replayed)
        const {row} = yield* _(findUserRow)
        expect(row).toHaveProperty('loginSessionId', null)
      })
    )
  })

  it('Keeps old clients without a login session id working without a proof', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        const created = yield* _(createUserEither(keys, undefined, noProof))
        expect(created._tag).toBe('Right')

        const refreshed = yield* _(refreshUser(keys, undefined, noProof))
        expect(refreshed._tag).toBe('Right')
      })
    )
  })
})
