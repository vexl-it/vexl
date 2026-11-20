import {SqlClient} from '@effect/sql'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  makeTestCommonAndSecurityHeaders,
} from './routes/contacts/utils'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {
  runPromiseInMockedEnvironment,
  type MockedContexts,
} from './utils/runPromiseInMockedEnvironment'

type TestEffect<A> = Effect.Effect<A, unknown, MockedContexts>

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
