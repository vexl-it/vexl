import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Array, Effect, Option, Order, pipe, Schema} from 'effect'
import {ContactDbService} from '../db/ContactDbService'
import {
  type FindCommonFriendsPaginatedParams,
  type FindCommonFriendsPaginatedResult,
} from '../db/ContactDbService/queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'
import {UserNotificationService} from '../services/UserNotificationService'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
} from './routes/contacts/utils'
import {
  clearEnqueuedNotifications,
  getEnqueuedNotifications,
} from './utils/mockEnqueueUserNotification'
import {generateAnotherNumber, type TestEffect} from './utils/multipleNumbers'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

describe('notifications of an account with several phone numbers', () => {
  it('notifies the account once when only its number without the token has the new user as a second level contact', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733800001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733800002'))
        const sharedContact = yield* _(
          generateKeysAndHasheForNumber('+420733800003')
        )
        const newUser = yield* _(generateKeysAndHasheForNumber('+420733800004'))

        yield* _(createUserOnNetwork(main))
        yield* _(createAndImportUsersFromNetwork(extra, [sharedContact]))
        yield* _(createUserOnNetwork(newUser))

        // Let the notifications forked by the imports above finish
        yield* _(Effect.sleep(200))
        yield* _(clearEnqueuedNotifications)
        const notificationService = yield* _(UserNotificationService)
        yield* _(
          notificationService.notifyOthersAboutNewUser({
            firstLevelHashes: [sharedContact.serverHashedNumber],
            secondLevelHashes: [sharedContact.serverHashedNumber],
            ownerHash: newUser.serverHashedNumber,
          })
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

const findAllCommonFriends = (
  params: Omit<FindCommonFriendsPaginatedParams, 'userContactId'>,
  userContactId = 0
): TestEffect<readonly FindCommonFriendsPaginatedResult[]> =>
  ContactDbService.pipe(
    Effect.flatMap((contactDb) =>
      contactDb.findCommonFriendsPaginated({...params, userContactId})
    ),
    Effect.flatMap((page) =>
      Array.isNonEmptyReadonlyArray(page)
        ? Effect.map(
            findAllCommonFriends(
              params,
              Array.lastNonEmpty(page).userContactId
            ),
            (nextPages) => [...page, ...nextPages]
          )
        : Effect.succeed([])
    )
  )

describe('common friends of accounts with several phone numbers', () => {
  it('lists every common friend and verifies only those who saved both accounts, page by page', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const requester = yield* _(
          generateKeysAndHasheForNumber('+420733810001')
        )
        const requesterExtra = yield* _(
          generateAnotherNumber(requester, '+420733810002')
        )
        const otherSide = yield* _(
          generateKeysAndHasheForNumber('+420733810003')
        )
        const otherSideExtra = yield* _(
          generateAnotherNumber(otherSide, '+420733810004')
        )
        const someoneElse = yield* _(
          generateKeysAndHasheForNumber('+420733810005')
        )
        const savedBoth = yield* _(
          generateKeysAndHasheForNumber('+420733810006')
        )
        const savedRequester = yield* _(
          generateKeysAndHasheForNumber('+420733810007')
        )
        const savedOtherSide = yield* _(
          generateKeysAndHasheForNumber('+420733810008')
        )
        const publicNumber = yield* _(
          generateKeysAndHasheForNumber('+420733810009')
        )
        const privateNumber = yield* _(
          generateKeysAndHasheForNumber('+420733810010')
        )

        yield* _(createAndImportUsersFromNetwork(requesterExtra, []))
        yield* _(
          createAndImportUsersFromNetwork(requester, [
            savedBoth,
            savedRequester,
            savedOtherSide,
            publicNumber,
            privateNumber,
          ])
        )
        // Contact ids ordered: otherSide's rows, someoneElse's rows,
        // otherSideExtra's rows, so the account's rows straddle a page cursor.
        yield* _(
          createAndImportUsersFromNetwork(otherSide, [
            savedRequester,
            publicNumber,
            privateNumber,
          ])
        )
        yield* _(
          createAndImportUsersFromNetwork(someoneElse, [
            savedBoth,
            publicNumber,
          ])
        )
        yield* _(
          createAndImportUsersFromNetwork(otherSideExtra, [
            savedBoth,
            savedOtherSide,
          ])
        )
        yield* _(
          createAndImportUsersFromNetwork(savedBoth, [
            requesterExtra,
            otherSideExtra,
          ])
        )
        yield* _(createAndImportUsersFromNetwork(savedRequester, [requester]))
        yield* _(createAndImportUsersFromNetwork(savedOtherSide, [otherSide]))

        const findWith = ({
          limit,
          publicImportCountThreshold,
        }: {
          limit: number
          publicImportCountThreshold: number
        }): TestEffect<
          Array<{
            publicKey: string
            commonFriends: readonly string[]
            verifiedFriends: readonly string[]
          }>
        > =>
          Effect.map(
            findAllCommonFriends({
              ownerHash: requester.serverHashedNumber,
              ownerPublicKey: requester.keys.publicKeyPemBase64,
              publicKeys: [
                requester.keys.publicKeyPemBase64,
                otherSide.keys.publicKeyPemBase64,
                someoneElse.keys.publicKeyPemBase64,
              ],
              publicKeysV2: [],
              limit,
              publicImportCountThreshold,
            }),
            Array.map((one) => ({
              publicKey: one.publicKey,
              commonFriends: one.commonFriends,
              verifiedFriends: one.verifiedFriends,
            }))
          )
        const sortedHashes = (
          users: ReadonlyArray<{serverHashedNumber: string}>
        ): string[] =>
          pipe(
            users,
            Array.map((one) => one.serverHashedNumber),
            Array.sort(Order.string)
          )

        const expected = [
          {
            publicKey: someoneElse.keys.publicKeyPemBase64,
            commonFriends: sortedHashes([savedBoth, publicNumber]),
            verifiedFriends: [],
          },
          {
            publicKey: otherSide.keys.publicKeyPemBase64,
            commonFriends: sortedHashes([
              savedBoth,
              savedRequester,
              savedOtherSide,
              publicNumber,
              privateNumber,
            ]),
            verifiedFriends: [savedBoth.serverHashedNumber],
          },
        ]
        const withoutPublicNumber = Array.map(expected, (one) => ({
          ...one,
          commonFriends: Array.filter(
            one.commonFriends,
            (hash) => hash !== publicNumber.serverHashedNumber
          ),
        }))

        for (const limit of [1, 10]) {
          expect(
            yield* _(findWith({limit, publicImportCountThreshold: -1}))
          ).toEqual(expected)
          expect(
            yield* _(findWith({limit, publicImportCountThreshold: 2}))
          ).toEqual(withoutPublicNumber)
        }
      })
    )
  })
})
