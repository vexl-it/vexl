import {SqlClient} from '@effect/sql'
import {MAX_PHONE_NUMBERS_PER_ACCOUNT} from '@vexl-next/rest-api/src/services/contact/contracts'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Either, Option} from 'effect'
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

const deleteAccount = (user: DummyUser): TestEffect<void> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(setAuthHeaders(user.authHeaders))
    yield* _(
      app.User.deleteAccount({
        headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
      })
    )
  })

describe('deleting the account', () => {
  it('deletes every number of the account with its contacts and nothing else', async () => {
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

        yield* _(deleteAccount(main))

        for (const one of numbers) {
          expect(
            yield* _(findPublicKeysOfHash(one.serverHashedNumber))
          ).toEqual([])
          expect(yield* _(countContactsOf(one.serverHashedNumber))).toBe(0)
        }
        expect(
          yield* _(findPublicKeysOfHash(otherAccount.serverHashedNumber))
        ).toEqual([otherAccount.keys.publicKeyPemBase64])
        expect(yield* _(countContactsOf(otherAccount.serverHashedNumber))).toBe(
          1
        )
      })
    )
  })

  it('deletes the account even after its main number moved to another account', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420734600001'))
        const extra = yield* _(generateAnotherNumber(main, '+420734600002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420734600003'))
        yield* _(createAndImportUsersFromNetwork(main, [friend]))
        yield* _(createAndImportUsersFromNetwork(extra, [friend]))

        const newOwnerOfMain = yield* _(
          generateKeysAndHasheForNumber('+420734600001')
        )
        yield* _(createAndImportUsersFromNetwork(newOwnerOfMain, [friend]))

        yield* _(deleteAccount(main))

        expect(
          yield* _(findPublicKeysOfHash(extra.serverHashedNumber))
        ).toEqual([])
        expect(yield* _(countContactsOf(extra.serverHashedNumber))).toBe(0)
        expect(
          yield* _(findPublicKeysOfHash(newOwnerOfMain.serverHashedNumber))
        ).toEqual([newOwnerOfMain.keys.publicKeyPemBase64])
        expect(
          yield* _(countContactsOf(newOwnerOfMain.serverHashedNumber))
        ).toBe(1)
      })
    )
  })
})
