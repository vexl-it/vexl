import {Array, Effect, Option} from 'effect'
import {ContactDbService} from '../db/ContactDbService'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
} from './routes/contacts/utils'
import {generateAnotherNumber} from './utils/multipleNumbers'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

describe('second level contacts of an account with several phone numbers', () => {
  it('never returns the account itself, so a page is not wasted on it', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const main = yield* _(generateKeysAndHasheForNumber('+420733910001'))
        const extra = yield* _(generateAnotherNumber(main, '+420733910002'))
        const sharedContact = yield* _(
          generateKeysAndHasheForNumber('+420733910003')
        )
        const friend = yield* _(generateKeysAndHasheForNumber('+420733910004'))

        // The extra number imports before the friend, so its contact row has
        // the lower id and would come first in the page.
        yield* _(createAndImportUsersFromNetwork(main, [sharedContact]))
        yield* _(createAndImportUsersFromNetwork(extra, [sharedContact]))
        yield* _(createAndImportUsersFromNetwork(friend, [sharedContact]))

        const contactDb = yield* _(ContactDbService)
        const fetchPage = (
          userId: number
        ): ReturnType<
          typeof contactDb.findSecondLevelContactsPublicKeysByHashFromPaginated
        > =>
          contactDb.findSecondLevelContactsPublicKeysByHashFromPaginated({
            hashFrom: main.serverHashedNumber,
            ownerPublicKey: main.keys.publicKeyPemBase64,
            userId,
            limit: 1,
            activeWithinDays: -1,
            hideUsersWithoutPublicKeyV2: false,
            publicImportCountThreshold: -1,
          })

        const firstPage = yield* _(fetchPage(0))
        expect(Array.map(firstPage, (one) => one.publicKey)).toEqual([
          friend.keys.publicKeyPemBase64,
        ])

        const lastSeenUserId = Option.getOrThrow(Array.head(firstPage)).userId
        expect(yield* _(fetchPage(lastSeenUserId))).toEqual([])
      })
    )
  })
})
