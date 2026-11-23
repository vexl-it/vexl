import {
  generateLoginSessionId,
  type LoginSessionId,
} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ecdsaSignE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
  loginSessionProofMessage,
  UserNotFoundError,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Either, Option} from 'effect'
import {
  generateKeysAndHasheForNumber,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
} from './routes/contacts/utils'
import {generateAnotherNumber, type TestEffect} from './utils/multipleNumbers'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

type Response = Either.Either<unknown, unknown>

// A proof is accepted once per signing time, so never sign two in the same ms.
const signProof = (
  user: DummyUser,
  loginSessionId: LoginSessionId
): TestEffect<LoginSessionProof> =>
  Effect.gen(function* (_) {
    yield* _(Effect.sleep('2 millis'))
    const signedAt = unixMillisecondsNow()
    const signature = yield* _(
      ecdsaSignE(user.keys.privateKeyPemBase64)(
        loginSessionProofMessage({loginSessionId, signedAt})
      )
    )
    return {signedAt, signature}
  })

const headersOf = (
  user: DummyUser
): TestEffect<ReturnType<typeof makeTestCommonAndSecurityHeaders>> =>
  Effect.as(
    setAuthHeaders(user.authHeaders),
    makeTestCommonAndSecurityHeaders(user.authHeaders)
  )

const createUser = (
  user: DummyUser,
  loginSessionId?: LoginSessionId
): TestEffect<void> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const headers = yield* _(headersOf(user))
    yield* _(
      app.User.createUser({
        payload: {
          vexlNotificationToken: Option.none(),
          publicKeyV2: Option.none(),
          loginSessionId,
          loginSessionProof:
            loginSessionId === undefined
              ? undefined
              : yield* _(signProof(user, loginSessionId)),
        },
        headers,
      })
    )
  })

const restoreUser = (
  user: DummyUser,
  loginSessionId: LoginSessionId,
  loginSessionProof?: LoginSessionProof
): TestEffect<Response> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const headers = yield* _(headersOf(user))
    return yield* _(
      app.User.restoreUser({
        payload: {
          vexlNotificationToken: Option.none(),
          loginSessionId,
          loginSessionProof:
            loginSessionProof ?? (yield* _(signProof(user, loginSessionId))),
        },
        headers,
      }),
      Effect.either
    )
  })

const refreshUser = (
  user: DummyUser,
  loginSessionId?: LoginSessionId,
  loginSessionProof?: LoginSessionProof
): TestEffect<Response> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const headers = yield* _(headersOf(user))
    return yield* _(
      app.User.refreshUser({
        payload: {
          offersAlive: true,
          vexlNotificationToken: Option.none(),
          loginSessionId,
          loginSessionProof,
        },
        headers,
      }),
      Effect.either
    )
  })

const deleteUser = (user: DummyUser): TestEffect<void> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(app.User.deleteUser({headers: yield* _(headersOf(user))}))
  })

// An account with a main number and one extra, both on the given session.
const createAccount = (
  numberPrefix: string,
  loginSessionId?: LoginSessionId
): TestEffect<{main: DummyUser; extra: DummyUser}> =>
  Effect.gen(function* (_) {
    const main = yield* _(generateKeysAndHasheForNumber(`${numberPrefix}1`))
    const extra = yield* _(generateAnotherNumber(main, `${numberPrefix}2`))
    yield* _(createUser(main, loginSessionId))
    yield* _(createUser(extra, loginSessionId))
    return {main, extra}
  })

describe('refreshing a number the account no longer has', () => {
  it('logs out a device whose account moved to another device', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const oldDevice = generateLoginSessionId()
        const {main, extra} = yield* _(createAccount('+42073490000', oldDevice))

        // Restored on a new device, which then switched to another number.
        const newDevice = generateLoginSessionId()
        yield* _(restoreUser(main, newDevice), Effect.flatten)
        yield* _(restoreUser(extra, newDevice), Effect.flatten)
        const newNumber = yield* _(generateAnotherNumber(main, '+420734900003'))
        yield* _(createUser(newNumber, newDevice))
        yield* _(deleteUser(main))
        yield* _(deleteUser(extra))

        const proof = yield* _(signProof(main, oldDevice))
        expectErrorResponse(LoggedInOnAnotherDeviceError)(
          yield* _(refreshUser(main, oldDevice, proof))
        )
        expectErrorResponse(LoggedInOnAnotherDeviceError)(
          yield* _(
            refreshUser(extra, oldDevice, yield* _(signProof(extra, oldDevice)))
          )
        )

        // The proof is used up, it can't take the account back.
        expectErrorResponse(InvalidLoginSessionProofError)(
          yield* _(restoreUser(newNumber, oldDevice, proof))
        )
        expect(
          Either.isRight(
            yield* _(
              refreshUser(
                newNumber,
                newDevice,
                yield* _(signProof(newNumber, newDevice))
              )
            )
          )
        ).toBe(true)
      })
    )
  })

  it('reports a number removed on the same device as not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const session = generateLoginSessionId()
        const {extra} = yield* _(createAccount('+42073490001', session))
        yield* _(deleteUser(extra))

        expectErrorResponse(UserNotFoundError)(
          yield* _(
            refreshUser(extra, session, yield* _(signProof(extra, session)))
          )
        )
      })
    )
  })

  it('reports a number taken over by another account as not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const session = generateLoginSessionId()
        const {extra} = yield* _(createAccount('+42073490002', session))
        const otherAccount = yield* _(
          generateKeysAndHasheForNumber('+420734900022')
        )
        yield* _(createUser(otherAccount, generateLoginSessionId()))

        expectErrorResponse(UserNotFoundError)(
          yield* _(
            refreshUser(extra, session, yield* _(signProof(extra, session)))
          )
        )
      })
    )
  })

  it('reports the last number of a deleted account as not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const session = generateLoginSessionId()
        const {main, extra} = yield* _(createAccount('+42073490003', session))
        yield* _(deleteUser(main))
        yield* _(deleteUser(extra))

        expectErrorResponse(UserNotFoundError)(
          yield* _(
            refreshUser(main, session, yield* _(signProof(main, session)))
          )
        )
      })
    )
  })

  it.each<{
    name: string
    numberPrefix: string
    caller?: LoginSessionId
    remaining?: LoginSessionId
  }>([
    {
      name: 'sent without a login session',
      numberPrefix: '+42073490004',
      remaining: generateLoginSessionId(),
    },
    {
      name: 'while the remaining number has no login session',
      numberPrefix: '+42073490005',
      caller: generateLoginSessionId(),
    },
  ])(
    'reports a removed number $name as not found',
    async ({numberPrefix, caller, remaining}) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const {extra} = yield* _(createAccount(numberPrefix, remaining))
          yield* _(deleteUser(extra))

          expectErrorResponse(UserNotFoundError)(
            yield* _(
              refreshUser(
                extra,
                caller,
                caller === undefined
                  ? undefined
                  : yield* _(signProof(extra, caller))
              )
            )
          )
        })
      )
    }
  )
})
