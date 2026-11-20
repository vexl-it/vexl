import {SqlClient} from '@effect/sql'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, Order, Schema} from 'effect'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  importUsersFromNetwork,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
} from './routes/contacts/utils'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from './utils/mockEnqueueUserNotification'
import {generateAnotherNumber, type TestEffect} from './utils/multipleNumbers'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const contactsOf = (
  hash: ServerHashedNumber
): TestEffect<ReadonlyArray<{hashTo: string}>> =>
  Effect.flatMap(
    SqlClient.SqlClient,
    (sql) => sql<{hashTo: string}>`
      SELECT
        hash_to
      FROM
        user_contact
      WHERE
        hash_from = ${hash}
    `
  )

const sortedTokensOf = (users: readonly DummyUser[]): string[] =>
  Array.sort(
    Array.map(users, (user) =>
      Schema.encodeSync(VexlNotificationToken)(
        Option.getOrThrow(user.vexlNotificationToken)
      )
    ),
    Order.string
  )

// Imports notify in a forked fiber
const sortedNotifiedTokensAfter = (
  importEffect: TestEffect<unknown>
): TestEffect<string[]> =>
  Effect.gen(function* (_) {
    yield* _(Effect.sleep(200))
    yield* _(clearEnqueuedNotifications)
    yield* _(importEffect)
    yield* _(Effect.sleep(200))
    return Array.sort(
      Array.map(yield* _(getEnqueuedNotifications), (one) => one.task.token),
      Order.string
    )
  })

describe('a phone number taken over by another account', () => {
  it('refuses imports and fetches from the credentials of its previous holder', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const previousHolder = yield* _(
          generateKeysAndHasheForNumber('+420734100001')
        )
        const holder = yield* _(generateKeysAndHasheForNumber('+420734100001'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420734100002'))
        const stranger = yield* _(
          generateKeysAndHasheForNumber('+420734100003')
        )

        yield* _(createUserOnNetwork(friend))
        yield* _(createUserOnNetwork(stranger))
        yield* _(createAndImportUsersFromNetwork(previousHolder, [stranger]))
        yield* _(createAndImportUsersFromNetwork(holder, [friend]))

        const previousHolderHeaders = makeTestCommonAndSecurityHeaders(
          previousHolder.authHeaders
        )
        yield* _(setAuthHeaders(previousHolder.authHeaders))
        const importError = yield* _(
          app.Contact.importContacts({
            payload: {contacts: [stranger.hashedNumber], replace: true},
            headers: previousHolderHeaders,
          }),
          Effect.flip
        )
        expect(importError._tag).toBe('UserNotFoundError')
        expect(yield* _(contactsOf(holder.serverHashedNumber))).toEqual([
          {hashTo: friend.serverHashedNumber},
        ])

        const levels: ReadonlyArray<'FIRST' | 'SECOND'> = ['FIRST', 'SECOND']
        for (const level of levels) {
          const fetchError = yield* _(
            app.Contact.fetchMyContactsPaginated({
              headers: previousHolderHeaders,
              urlParams: {level, limit: 10},
            }),
            Effect.flip
          )
          expect(fetchError._tag).toBe('UserNotFoundError')
        }
      })
    )
  })
})

describe('importing contacts under another number of the account', () => {
  it('notifies nobody when the account already imported the same contacts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420734200001'))
        const extra = yield* _(generateAnotherNumber(main, '+420734200002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420734200003'))
        const friendOfFriend = yield* _(
          generateKeysAndHasheForNumber('+420734200004')
        )

        yield* _(createAndImportUsersFromNetwork(friend, [main, extra]))
        yield* _(createAndImportUsersFromNetwork(friendOfFriend, [friend]))
        yield* _(createAndImportUsersFromNetwork(main, [friend]))
        yield* _(createUserOnNetwork(extra))

        expect(
          yield* _(
            sortedNotifiedTokensAfter(importUsersFromNetwork(extra, [friend]))
          )
        ).toEqual([])
        expect(yield* _(contactsOf(extra.serverHashedNumber))).toEqual([
          {hashTo: friend.serverHashedNumber},
        ])
      })
    )
  })

  it('notifies only about contacts new to the whole account', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420734300001'))
        const extra = yield* _(generateAnotherNumber(main, '+420734300002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420734300003'))
        const friendOfFriend = yield* _(
          generateKeysAndHasheForNumber('+420734300004')
        )
        const newcomer = yield* _(
          generateKeysAndHasheForNumber('+420734300005')
        )
        const friendOfNewcomer = yield* _(
          generateKeysAndHasheForNumber('+420734300006')
        )

        yield* _(createAndImportUsersFromNetwork(friend, [main]))
        yield* _(createAndImportUsersFromNetwork(friendOfFriend, [friend]))
        yield* _(createAndImportUsersFromNetwork(newcomer, [extra]))
        yield* _(createAndImportUsersFromNetwork(friendOfNewcomer, [newcomer]))
        yield* _(createAndImportUsersFromNetwork(main, [friend]))
        yield* _(createUserOnNetwork(extra))

        expect(
          yield* _(
            sortedNotifiedTokensAfter(
              importUsersFromNetwork(extra, [friend, newcomer])
            )
          )
        ).toEqual(sortedTokensOf([newcomer, friendOfNewcomer]))
      })
    )
  })
})
