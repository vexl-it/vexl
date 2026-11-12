import {SqlClient} from '@effect/sql'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, Order, pipe, Schema} from 'effect'
import {UserNotificationService} from '../services/UserNotificationService'
import {hashForClient, serverHashPhoneNumber} from '../utils/serverHashContact'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
} from './routes/contacts/utils'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from './utils/mockEnqueueUserNotification'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  runPromiseInMockedEnvironment,
  type MockedContexts,
} from './utils/runPromiseInMockedEnvironment'

type TestEffect<A> = Effect.Effect<A, unknown, MockedContexts>

// Another phone number of the same account: same keys, own hash, no token.
const generateAnotherNumber = (
  account: DummyUser,
  numberRaw: string
): TestEffect<DummyUser> =>
  Effect.gen(function* (_) {
    const phoneNumber = Schema.decodeSync(E164PhoneNumber)(numberRaw)
    const hashedNumber = yield* _(hashPhoneNumber(phoneNumber))
    const serverHashedNumber = yield* _(serverHashPhoneNumber(hashedNumber))
    return {
      ...account,
      phoneNumber,
      hashedNumber,
      authHeaders: yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: account.keys.publicKeyPemBase64,
        })
      ),
      vexlNotificationToken: Option.none(),
      serverHashedNumber,
      serverHashedNumberForClient: yield* _(hashForClient(serverHashedNumber)),
    }
  })

const findUserRow = (
  hash: ServerHashedNumber
): TestEffect<
  ReadonlyArray<{vexlNotificationToken: string | null; refreshedAt: Date}>
> =>
  Effect.flatMap(
    SqlClient.SqlClient,
    (sql) => sql<{vexlNotificationToken: string | null; refreshedAt: Date}>`
      SELECT
        *
      FROM
        users
      WHERE
        hash = ${hash}
    `
  )

const countContactsOf = (hash: ServerHashedNumber): TestEffect<number> =>
  Effect.flatMap(SqlClient.SqlClient, (sql) =>
    sql<{count: string}>`
      SELECT
        count(*) AS count
      FROM
        user_contact
      WHERE
        hash_from = ${hash}
    `.pipe(Effect.map(([row]) => Number(row?.count)))
  )

const fetchAllMyContacts = (
  user: DummyUser,
  level: 'FIRST' | 'SECOND'
): TestEffect<string[]> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(setAuthHeaders(user.authHeaders))
    return yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          app.Contact.fetchMyContactsPaginated({
            headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
            urlParams: {level, limit: 1, nextPageToken},
          }),
      })
    )
  })

interface CommonConnection {
  publicKey: string
  common: {hashes: readonly string[]; verifiedHashes: readonly string[]}
}

const fetchAllCommonConnections = (
  user: DummyUser,
  publicKeys: PublicKeyPemBase64[]
): TestEffect<CommonConnection[]> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(setAuthHeaders(user.authHeaders))
    return yield* _(
      fetchAllPaginatedData({
        fetchEffectToRun: (nextPageToken) =>
          app.Contact.fetchCommonConnectionsPaginated({
            headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
            payload: {publicKeys, limit: 1, nextPageToken},
          }),
      })
    )
  })

const sorted = (values: readonly string[]): string[] =>
  Array.sort(values, Order.string)

describe('one account with several phone numbers', () => {
  it('creates, refreshes and deletes each number on its own', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        const main = yield* _(generateKeysAndHasheForNumber('+420733100001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733100002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420733100003'))

        yield* _(createAndImportUsersFromNetwork(main, [friend]))
        yield* _(createAndImportUsersFromNetwork(extra, [friend]))

        const [mainRow] = yield* _(findUserRow(main.serverHashedNumber))
        const [extraRow] = yield* _(findUserRow(extra.serverHashedNumber))
        expect(mainRow?.vexlNotificationToken).toEqual(
          Option.getOrThrow(main.vexlNotificationToken)
        )
        expect(extraRow?.vexlNotificationToken).toBeNull()
        expect(yield* _(countContactsOf(main.serverHashedNumber))).toBe(1)
        expect(yield* _(countContactsOf(extra.serverHashedNumber))).toBe(1)

        const longAgo = new Date('2020-06-01')
        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = ${longAgo}
          WHERE
            public_key = ${main.keys.publicKeyPemBase64}
        `)
        yield* _(setAuthHeaders(extra.authHeaders))
        yield* _(
          app.User.refreshUser({
            payload: {offersAlive: true, vexlNotificationToken: Option.none()},
            headers: makeTestCommonAndSecurityHeaders(extra.authHeaders),
          })
        )
        const [mainAfterRefresh] = yield* _(
          findUserRow(main.serverHashedNumber)
        )
        const [extraAfterRefresh] = yield* _(
          findUserRow(extra.serverHashedNumber)
        )
        expect(mainAfterRefresh?.refreshedAt.getFullYear()).toBe(
          longAgo.getFullYear()
        )
        expect(mainAfterRefresh?.vexlNotificationToken).toEqual(
          Option.getOrThrow(main.vexlNotificationToken)
        )
        expect(extraAfterRefresh?.refreshedAt.getFullYear()).toBeGreaterThan(
          longAgo.getFullYear()
        )
        expect(extraAfterRefresh?.vexlNotificationToken).toBeNull()

        yield* _(setAuthHeaders(main.authHeaders))
        yield* _(
          app.User.refreshUser({
            payload: {
              offersAlive: true,
              vexlNotificationToken: main.vexlNotificationToken,
            },
            headers: makeTestCommonAndSecurityHeaders(main.authHeaders),
          })
        )
        const [extraAfterMainRefresh] = yield* _(
          findUserRow(extra.serverHashedNumber)
        )
        expect(extraAfterMainRefresh?.vexlNotificationToken).toBeNull()

        yield* _(setAuthHeaders(extra.authHeaders))
        yield* _(
          app.User.deleteUser({
            headers: makeTestCommonAndSecurityHeaders(extra.authHeaders),
          })
        )
        expect(yield* _(findUserRow(extra.serverHashedNumber))).toHaveLength(0)
        expect(yield* _(countContactsOf(extra.serverHashedNumber))).toBe(0)
        expect(yield* _(findUserRow(main.serverHashedNumber))).toHaveLength(1)
        expect(yield* _(countContactsOf(main.serverHashedNumber))).toBe(1)
      })
    )
  })

  it('keeps a push token only on the number of the account that set it last', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const main = yield* _(generateKeysAndHasheForNumber('+420733600001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733600002'))
        const someoneElse = yield* _(
          generateKeysAndHasheForNumber('+420733600003')
        )
        yield* _(createUserOnNetwork(main))
        yield* _(createUserOnNetwork(extra))
        yield* _(createUserOnNetwork(someoneElse))

        const refreshWithToken = (
          user: DummyUser,
          token: string
        ): TestEffect<unknown> =>
          Effect.zipRight(
            setAuthHeaders(user.authHeaders),
            app.User.refreshUser({
              payload: {
                offersAlive: true,
                vexlNotificationToken: Option.some(
                  Schema.decodeSync(VexlNotificationToken)(token)
                ),
              },
              headers: makeTestCommonAndSecurityHeaders(user.authHeaders),
            })
          )
        const tokensOf = (
          users: DummyUser[]
        ): TestEffect<ReadonlyArray<string | null | undefined>> =>
          Effect.forEach(users, (user) =>
            Effect.map(
              findUserRow(user.serverHashedNumber),
              ([row]) => row?.vexlNotificationToken
            )
          )

        yield* _(refreshWithToken(extra, 'vexl_nt_extra'))
        expect(yield* _(tokensOf([main, extra, someoneElse]))).toEqual([
          null,
          'vexl_nt_extra',
          'vexl_nt_+420733600003',
        ])

        yield* _(refreshWithToken(main, 'vexl_nt_main'))
        expect(yield* _(tokensOf([main, extra, someoneElse]))).toEqual([
          'vexl_nt_main',
          null,
          'vexl_nt_+420733600003',
        ])
      })
    )
  })

  it('returns the account once to a contact who saved both numbers, and never to itself', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733200001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733200002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420733200003'))
        const otherFriend = yield* _(
          generateKeysAndHasheForNumber('+420733200004')
        )

        yield* _(createAndImportUsersFromNetwork(main, [friend, otherFriend]))
        yield* _(createAndImportUsersFromNetwork(extra, [friend, otherFriend]))
        yield* _(
          createAndImportUsersFromNetwork(friend, [main, extra, otherFriend])
        )
        yield* _(createAndImportUsersFromNetwork(otherFriend, [friend]))

        expect(sorted(yield* _(fetchAllMyContacts(friend, 'FIRST')))).toEqual(
          sorted([
            main.keys.publicKeyPemBase64,
            otherFriend.keys.publicKeyPemBase64,
          ])
        )
        expect(yield* _(fetchAllMyContacts(otherFriend, 'SECOND'))).toEqual([
          main.keys.publicKeyPemBase64,
        ])

        for (const myNumber of [main, extra]) {
          expect(yield* _(fetchAllMyContacts(myNumber, 'FIRST'))).not.toContain(
            main.keys.publicKeyPemBase64
          )
          expect(
            yield* _(fetchAllMyContacts(myNumber, 'SECOND'))
          ).not.toContain(main.keys.publicKeyPemBase64)
          const common = yield* _(
            fetchAllCommonConnections(myNumber, [
              main.keys.publicKeyPemBase64,
              friend.keys.publicKeyPemBase64,
            ])
          )
          expect(Array.map(common, (one) => one.publicKey)).toEqual([
            friend.keys.publicKeyPemBase64,
          ])
        }
      })
    )
  })

  it('merges common and verified friends of all numbers across pages', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733300001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733300002'))
        const requester = yield* _(
          generateKeysAndHasheForNumber('+420733300003')
        )
        const savedMain = yield* _(
          generateKeysAndHasheForNumber('+420733300004')
        )
        const savedExtra = yield* _(
          generateKeysAndHasheForNumber('+420733300005')
        )
        const someoneElse = yield* _(
          generateKeysAndHasheForNumber('+420733300006')
        )

        yield* _(createAndImportUsersFromNetwork(savedMain, [requester, main]))
        yield* _(
          createAndImportUsersFromNetwork(savedExtra, [requester, extra])
        )
        yield* _(
          createAndImportUsersFromNetwork(requester, [savedMain, savedExtra])
        )
        // Contact ids ordered: main's rows, someoneElse's rows, extra's rows,
        // so the account's rows straddle a page boundary.
        yield* _(createAndImportUsersFromNetwork(main, [savedMain, savedExtra]))
        yield* _(
          createAndImportUsersFromNetwork(someoneElse, [savedMain, savedExtra])
        )
        yield* _(
          createAndImportUsersFromNetwork(extra, [savedMain, savedExtra])
        )

        const common = yield* _(
          fetchAllCommonConnections(requester, [
            main.keys.publicKeyPemBase64,
            someoneElse.keys.publicKeyPemBase64,
          ])
        )
        const forAccount = Array.filter(
          common,
          (one) => one.publicKey === main.keys.publicKeyPemBase64
        )

        expect(forAccount).toHaveLength(1)
        const bothSavers = sorted([
          savedMain.serverHashedNumberForClient,
          savedExtra.serverHashedNumberForClient,
        ])
        expect(sorted(forAccount[0]?.common.hashes ?? [])).toEqual(bothSavers)
        expect(sorted(forAccount[0]?.common.verifiedHashes ?? [])).toEqual(
          bothSavers
        )
      })
    )
  })

  it('does not notify the account about its own new number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733400001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733400002'))
        const friend = yield* _(generateKeysAndHasheForNumber('+420733400003'))
        const friendOfFriend = yield* _(
          generateKeysAndHasheForNumber('+420733400004')
        )

        yield* _(createAndImportUsersFromNetwork(main, [friend]))
        yield* _(createAndImportUsersFromNetwork(friend, [extra]))
        yield* _(createAndImportUsersFromNetwork(friendOfFriend, [friend]))
        yield* _(createUserOnNetwork(extra))

        // Let the notifications forked by the imports above finish
        yield* _(Effect.sleep(200))
        yield* _(clearEnqueuedNotifications)
        const notificationService = yield* _(UserNotificationService)
        yield* _(
          notificationService.notifyOthersAboutNewUser(
            [friend.serverHashedNumber],
            extra.serverHashedNumber
          )
        )

        const notifiedTokens = pipe(
          yield* _(getEnqueuedNotifications),
          Array.map((one) => one.task.token)
        )
        expect(sorted(notifiedTokens)).toEqual(
          sorted(
            Array.map([friend, friendOfFriend], (one) =>
              Schema.encodeSync(VexlNotificationToken)(
                Option.getOrThrow(one.vexlNotificationToken)
              )
            )
          )
        )
      })
    )
  })

  it('notifies the account once when a new user saved only its extra number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733500001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733500002'))
        const newUser = yield* _(generateKeysAndHasheForNumber('+420733500003'))

        yield* _(createAndImportUsersFromNetwork(main, [newUser]))
        yield* _(createAndImportUsersFromNetwork(extra, [newUser]))
        yield* _(createUserOnNetwork(newUser))

        // Let the notifications forked by the imports above finish
        yield* _(Effect.sleep(200))
        yield* _(clearEnqueuedNotifications)
        const notificationService = yield* _(UserNotificationService)
        yield* _(
          notificationService.notifyOthersAboutNewUser(
            [extra.serverHashedNumber],
            newUser.serverHashedNumber
          )
        )

        const notifiedTokens = pipe(
          yield* _(getEnqueuedNotifications),
          Array.map((one) => one.task.token)
        )
        expect(notifiedTokens).toEqual([
          Schema.encodeSync(VexlNotificationToken)(
            Option.getOrThrow(main.vexlNotificationToken)
          ),
        ])
      })
    )
  })
})
