import {SqlClient} from '@effect/sql'
import {
  generateLoginSessionId,
  type LoginSessionId,
} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  loginSessionProofMessage,
  MAX_PHONE_NUMBERS_PER_ACCOUNT,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Deferred, Effect, Either, Fiber, Option} from 'effect'
import {ContactDbService} from '../db/ContactDbService'
import {UserDbService} from '../db/UserDbService'
import {useUpLoginSessionProof} from '../routes/user/utils/ensureLoginSessionProof'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
} from './routes/contacts/utils'
import {
  countContactsOf,
  findPublicKeysOfHash,
  generateAnotherNumber,
  type TestEffect,
} from './utils/multipleNumbers'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const createUserEither = (
  user: DummyUser
): TestEffect<Either.Either<unknown, unknown>> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(setAuthHeaders(user.authHeaders))
    return yield* _(
      app.User.createUser({
        payload: {
          vexlNotificationToken: user.vexlNotificationToken,
          publicKeyV2: Option.none(),
        },
        headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
      }),
      Effect.either
    )
  })

// The main number plus extra ones up to the limit, all registered.
const createAccountAtLimit = (
  numberPrefix: string
): TestEffect<Array.NonEmptyReadonlyArray<DummyUser>> =>
  Effect.gen(function* (_) {
    const main = yield* _(generateKeysAndHasheForNumber(`${numberPrefix}01`))
    const extras = yield* _(
      Effect.forEach(Array.range(2, MAX_PHONE_NUMBERS_PER_ACCOUNT), (i) =>
        generateAnotherNumber(main, `${numberPrefix}0${i}`)
      )
    )
    const numbers = Array.prepend(extras, main)
    yield* _(Effect.forEach(numbers, createUserOnNetwork))
    return numbers
  })

const expectPhoneNumberLimitReached = (
  result: Either.Either<unknown, unknown>
): void => {
  expect(result).toMatchObject({
    _tag: 'Left',
    left: {_tag: 'PhoneNumberLimitReachedError'},
  })
}

describe('phone number limit per account', () => {
  it('rejects one more number and keeps the account as it was', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountAtLimit('+4207341000'))
        const main = Array.headNonEmpty(numbers)
        const oneTooMany = yield* _(
          generateAnotherNumber(main, '+420734100099')
        )

        expectPhoneNumberLimitReached(yield* _(createUserEither(oneTooMany)))

        expect(
          yield* _(findPublicKeysOfHash(oneTooMany.serverHashedNumber))
        ).toEqual([])
        for (const one of numbers) {
          expect(
            yield* _(findPublicKeysOfHash(one.serverHashedNumber))
          ).toEqual([main.keys.publicKeyPemBase64])
        }
      })
    )
  })

  it('does not take over a number of another account when at the limit', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountAtLimit('+4207342000'))
        const main = Array.headNonEmpty(numbers)
        const otherAccount = yield* _(
          generateKeysAndHasheForNumber('+420734200099')
        )
        const friend = yield* _(generateKeysAndHasheForNumber('+420734200098'))
        yield* _(createAndImportUsersFromNetwork(otherAccount, [friend]))

        const takeover = yield* _(generateAnotherNumber(main, '+420734200099'))
        expectPhoneNumberLimitReached(yield* _(createUserEither(takeover)))

        expect(
          yield* _(findPublicKeysOfHash(otherAccount.serverHashedNumber))
        ).toEqual([otherAccount.keys.publicKeyPemBase64])
        expect(yield* _(countContactsOf(otherAccount.serverHashedNumber))).toBe(
          1
        )
      })
    )
  })

  it('re-creates a number the account already holds at the limit', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountAtLimit('+4207343000'))
        const last = Array.lastNonEmpty(numbers)

        const result = yield* _(createUserEither(last))

        expect(Either.isRight(result)).toBe(true)
        expect(yield* _(findPublicKeysOfHash(last.serverHashedNumber))).toEqual(
          [last.keys.publicKeyPemBase64]
        )
      })
    )
  })
})

describe('registering a number', () => {
  it('drops contacts left under the number without a user row', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        const previousOwner = yield* _(
          generateKeysAndHasheForNumber('+420734400001')
        )
        const friend = yield* _(generateKeysAndHasheForNumber('+420734400002'))
        yield* _(createAndImportUsersFromNetwork(previousOwner, [friend]))
        yield* _(sql`
          DELETE FROM users
          WHERE
            hash = ${previousOwner.serverHashedNumber}
        `)
        expect(
          yield* _(countContactsOf(previousOwner.serverHashedNumber))
        ).toBe(1)

        const newOwner = yield* _(
          generateKeysAndHasheForNumber('+420734400001')
        )
        expect(Either.isRight(yield* _(createUserEither(newOwner)))).toBe(true)

        expect(yield* _(countContactsOf(newOwner.serverHashedNumber))).toBe(0)
      })
    )
  })
})

const signProof = (
  user: DummyUser,
  loginSessionId: LoginSessionId
): Effect.Effect<LoginSessionProof, CryptoError> => {
  const signedAt = unixMillisecondsNow()
  return ecdsaSignE(user.keys.privateKeyPemBase64)(
    loginSessionProofMessage({loginSessionId, signedAt})
  ).pipe(Effect.map((signature) => ({signedAt, signature})))
}

const deleteAccount = (
  user: DummyUser,
  loginSessionId: LoginSessionId,
  loginSessionProof?: LoginSessionProof
): TestEffect<Either.Either<unknown, unknown>> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(setAuthHeaders(user.authHeaders))
    return yield* _(
      app.User.deleteAccount({
        payload: {
          loginSessionId,
          loginSessionProof:
            loginSessionProof ?? (yield* _(signProof(user, loginSessionId))),
        },
        headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
      }),
      Effect.either
    )
  })

const setLoginSession = (
  numbers: readonly DummyUser[],
  loginSessionId: LoginSessionId
): TestEffect<void> =>
  Effect.flatMap(UserDbService, (userDb) =>
    Effect.forEach(
      numbers,
      (one) =>
        userDb.updateLoginSessionId({
          publicKey: one.keys.publicKeyPemBase64,
          hash: one.serverHashedNumber,
          loginSessionId,
        }),
      {discard: true}
    )
  )

const expectRegistered = (numbers: readonly DummyUser[]): TestEffect<void> =>
  Effect.forEach(
    numbers,
    (one) =>
      Effect.gen(function* (_) {
        expect(yield* _(findPublicKeysOfHash(one.serverHashedNumber))).toEqual([
          one.keys.publicKeyPemBase64,
        ])
        expect(yield* _(countContactsOf(one.serverHashedNumber))).toBe(1)
      }),
    {discard: true}
  )

// The main number plus two extra ones, each with one imported contact.
const createAccountWithContacts = (
  numberPrefix: string
): TestEffect<Array.NonEmptyReadonlyArray<DummyUser>> =>
  Effect.gen(function* (_) {
    const main = yield* _(generateKeysAndHasheForNumber(`${numberPrefix}01`))
    const numbers = Array.prepend(
      yield* _(
        Effect.forEach(['02', '03'], (suffix) =>
          generateAnotherNumber(main, `${numberPrefix}${suffix}`)
        )
      ),
      main
    )
    const friend = yield* _(generateKeysAndHasheForNumber(`${numberPrefix}09`))
    yield* _(
      Effect.forEach(numbers, (one) =>
        createAndImportUsersFromNetwork(one, [friend])
      )
    )
    return numbers
  })

const waitUntilBlockedOnPid = (blockingPid: number): TestEffect<boolean> =>
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)
    for (let i = 0; i < 200; i++) {
      const [{blockedCount}] = yield* _(sql<{blockedCount: number}>`
        SELECT
          count(*)::int AS blocked_count
        FROM
          pg_stat_activity
        WHERE
          ${blockingPid} = ANY (pg_blocking_pids(pid))
      `)
      if (blockedCount > 0) return true
      yield* _(Effect.sleep('10 millis'))
    }
    return false
  })

describe('deleting the account', () => {
  it.each([
    ['without a stored login session', false],
    ['from the device of the stored login session', true],
  ])(
    'deletes every number of the account with its contacts and nothing else %s',
    async (_, withStoredSession) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const main = yield* _(generateKeysAndHasheForNumber('+420734500001'))
          const numbers = [
            main,
            yield* _(generateAnotherNumber(main, '+420734500002')),
            yield* _(generateAnotherNumber(main, '+420734500003')),
          ]
          const otherAccount = yield* _(
            generateKeysAndHasheForNumber('+420734500004')
          )
          yield* _(
            Effect.forEach(numbers, (one) =>
              createAndImportUsersFromNetwork(one, [otherAccount])
            )
          )
          yield* _(createAndImportUsersFromNetwork(otherAccount, [main]))
          const session = generateLoginSessionId()
          if (withStoredSession) yield* _(setLoginSession(numbers, session))

          expect(Either.isRight(yield* _(deleteAccount(main, session)))).toBe(
            true
          )

          for (const one of numbers) {
            expect(
              yield* _(findPublicKeysOfHash(one.serverHashedNumber))
            ).toEqual([])
            expect(yield* _(countContactsOf(one.serverHashedNumber))).toBe(0)
          }
          yield* _(expectRegistered([otherAccount]))
        })
      )
    }
  )

  it.each([
    ['signed by another key', false],
    ['already used', true],
  ])('rejects a proof %s and deletes nothing', async (_, replayed) => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountWithContacts('+4207347000'))
        const main = Array.headNonEmpty(numbers)
        const session = generateLoginSessionId()
        const signer = replayed
          ? main
          : yield* _(generateKeysAndHasheForNumber('+420734700099'))
        const proof = yield* _(signProof(signer, session))
        if (replayed)
          yield* _(
            useUpLoginSessionProof({
              publicKey: main.keys.publicKeyPemBase64,
              loginSessionId: session,
              loginSessionProof: proof,
            })
          )

        expect(yield* _(deleteAccount(main, session, proof))).toMatchObject({
          _tag: 'Left',
          left: {_tag: 'InvalidLoginSessionProofError'},
        })
        yield* _(expectRegistered(numbers))
      })
    )
  })

  it.each([
    ['every number', 3],
    ['a number restored there before the others', 1],
  ])(
    'fails when %s is logged in on another device and deletes nothing',
    async (_, numbersOnOtherDevice) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const numbers = yield* _(createAccountWithContacts('+4207348000'))
          const session = generateLoginSessionId()
          yield* _(setLoginSession(numbers, session))
          yield* _(
            setLoginSession(
              Array.takeRight(numbers, numbersOnOtherDevice),
              generateLoginSessionId()
            )
          )

          expect(
            yield* _(deleteAccount(Array.headNonEmpty(numbers), session))
          ).toMatchObject({
            _tag: 'Left',
            left: {_tag: 'LoggedInOnAnotherDeviceError'},
          })
          yield* _(expectRegistered(numbers))
        })
      )
    }
  )

  it('deletes nothing through a number the account no longer holds', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountWithContacts('+4207346000'))
        const [main, ...extras] = numbers
        const newOwnerOfMain = yield* _(
          generateKeysAndHasheForNumber('+420734600001')
        )
        const friend = yield* _(generateKeysAndHasheForNumber('+420734600009'))
        yield* _(createAndImportUsersFromNetwork(newOwnerOfMain, [friend]))

        expect(
          Either.isRight(
            yield* _(deleteAccount(main, generateLoginSessionId()))
          )
        ).toBe(true)

        yield* _(expectRegistered([...extras, newOwnerOfMain]))
      })
    )
  })

  it('waits for an in-flight restore on the main number instead of deleting the restored account', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountWithContacts('+4207349000'))
        const [main, extra] = numbers
        const oldSession = generateLoginSessionId()
        const restoredSession = generateLoginSessionId()
        yield* _(setLoginSession(numbers, oldSession))

        const sql = yield* _(SqlClient.SqlClient)
        const userDb = yield* _(UserDbService)
        const mainUpdated = yield* _(Deferred.make<number>())
        const commitRestore = yield* _(Deferred.make<boolean>())

        // Hold the same transaction-scoped account lock restoreUser takes,
        // move a notification token off the extra row, and update main's session.
        const restoreFiber = yield* _(
          sql.withTransaction(
            Effect.gen(function* (_) {
              const [{pid}] = yield* _(sql<{pid: number}>`
                SELECT
                  pg_backend_pid() AS pid
              `)
              yield* _(
                userDb.lockAccountByPublicKey(main.keys.publicKeyPemBase64)
              )
              yield* _(sql`
                UPDATE users
                SET
                  vexl_notification_token = NULL
                WHERE
                  hash = ${extra.serverHashedNumber}
                  AND public_key = ${main.keys.publicKeyPemBase64}
              `)
              yield* _(sql`
                UPDATE users
                SET
                  login_session_id = ${restoredSession}
                WHERE
                  hash = ${main.serverHashedNumber}
                  AND public_key = ${main.keys.publicKeyPemBase64}
              `)
              yield* _(Deferred.succeed(mainUpdated, pid))
              yield* _(Deferred.await(commitRestore))
            })
          ),
          Effect.fork
        )

        const restorePid = yield* _(Deferred.await(mainUpdated))
        const deleteFiber = yield* _(
          Effect.fork(deleteAccount(extra, oldSession))
        )

        const blocked = yield* _(waitUntilBlockedOnPid(restorePid))
        yield* _(Deferred.succeed(commitRestore, true))

        yield* _(Fiber.join(restoreFiber))
        const deleteResult = yield* _(Fiber.join(deleteFiber))

        expect(blocked).toBe(true)
        expect(deleteResult).toMatchObject({
          _tag: 'Left',
          left: {_tag: 'LoggedInOnAnotherDeviceError'},
        })
        yield* _(expectRegistered(numbers))
      })
    )
  })

  it('waits for an in-flight account deletion before importing contacts on an extra number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const numbers = yield* _(createAccountWithContacts('+4207349100'))
        const [main, extra] = numbers
        const newFriend = yield* _(
          generateKeysAndHasheForNumber('+420734910099')
        )

        const sql = yield* _(SqlClient.SqlClient)
        const userDb = yield* _(UserDbService)
        const contactDb = yield* _(ContactDbService)
        const app = yield* _(NodeTestingApp)
        const accountDeleted = yield* _(Deferred.make<number>())
        const commitDelete = yield* _(Deferred.make<boolean>())

        const deleteFiber = yield* _(
          sql.withTransaction(
            Effect.gen(function* (_) {
              const [{pid}] = yield* _(sql<{pid: number}>`
                SELECT
                  pg_backend_pid() AS pid
              `)
              yield* _(
                userDb.lockAccountByPublicKey(main.keys.publicKeyPemBase64)
              )
              const deletedHashes = yield* _(
                userDb.deleteUsersByPublicKey(main.keys.publicKeyPemBase64)
              )
              yield* _(
                Effect.forEach(
                  deletedHashes,
                  contactDb.deleteContactsByHashFrom,
                  {discard: true}
                )
              )
              yield* _(Deferred.succeed(accountDeleted, pid))
              yield* _(Deferred.await(commitDelete))
            })
          ),
          Effect.fork
        )

        const deletePid = yield* _(Deferred.await(accountDeleted))
        yield* _(setAuthHeaders(extra.authHeaders))
        const importFiber = yield* _(
          app.Contact.importContacts({
            payload: {
              contacts: [newFriend.hashedNumber],
              replace: false,
            },
            headers: makeTestCommonAndSecurityHeaders(extra.authHeaders),
          }),
          Effect.either,
          Effect.fork
        )

        const blocked = yield* _(waitUntilBlockedOnPid(deletePid))
        yield* _(Deferred.succeed(commitDelete, true))

        yield* _(Fiber.join(deleteFiber))
        const importResult = yield* _(Fiber.join(importFiber))

        expect(blocked).toBe(true)
        expect(importResult).toMatchObject({
          _tag: 'Left',
          left: {_tag: 'UserNotFoundError'},
        })
        for (const one of numbers) {
          expect(yield* _(countContactsOf(one.serverHashedNumber))).toBe(0)
        }
      })
    )
  })
})
