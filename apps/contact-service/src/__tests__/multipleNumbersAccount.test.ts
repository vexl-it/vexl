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
