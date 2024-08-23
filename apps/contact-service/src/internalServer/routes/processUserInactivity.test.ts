import {SqlClient} from '@effect/sql'
import {Array, Effect, Logger, LogLevel, Order, pipe} from 'effect'
import {sendMessageMock} from '../../__tests__/utils/mockedFirebaseMessagingService'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from '../../__tests__/utils/routes/contacts/utils'
import {runPromiseInMockedEnvironment} from '../../__tests__/utils/runPromiseInMockedEnvironment'
import {processUserInactivity} from './processUserInactivity'

let user1: DummyUser
let user2: DummyUser
let user3: DummyUser

describe('Process user inactivity', () => {
  beforeAll(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        user1 = yield* _(generateKeysAndHasheForNumber('+420733333001'))
        user2 = yield* _(generateKeysAndHasheForNumber('+420733333002'))
        user3 = yield* _(generateKeysAndHasheForNumber('+420733333003'))

        yield* _(createAndImportUsersFromNetwork(user1, []))
        yield* _(createAndImportUsersFromNetwork(user2, []))
        yield* _(createAndImportUsersFromNetwork(user3, []))
      }).pipe(Logger.withMinimumLogLevel(LogLevel.None))
    )
  })
  it('Notifies inactive users and sets refreshed_at to null for users that were notified', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = now() - interval '3 days'
          WHERE
            ${sql.in('hash', [user1.hashedNumber, user2.hashedNumber])}
        `)

        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = now() - interval '2 days'
          WHERE
            hash = ${user3.hashedNumber}
        `)

        yield* _(processUserInactivity)

        const users = yield* _(sql`
          SELECT
            refreshed_at
          FROM
            users
          WHERE
            ${sql.in('hash', [user1.hashedNumber, user2.hashedNumber])}
        `)

        expect(
          pipe(
            users,
            Array.filter((one) => !!one.refreshedAt)
          )
        ).toHaveLength(0)

        expect(sendMessageMock).toHaveBeenCalledTimes(1)

        const call = sendMessageMock.mock.calls[0][0]
        expect(call.data?.type).toEqual('INACTIVITY_REMINDER')
        expect(
          pipe(call.tokens, Array.sort(Order.string), Array.join(','))
        ).toEqual(
          pipe(
            [user1.firebaseToken, user2.firebaseToken],
            Array.sort(Order.string),
            Array.join(',')
          )
        )

        const userThatWasNotChanged = yield* _(sql`
          SELECT
            refreshed_at
          FROM
            users
          WHERE
            hash = ${user3.hashedNumber}
        `)
        expect(userThatWasNotChanged).toHaveLength(1)
        expect(userThatWasNotChanged[0]).toHaveProperty('refreshedAt')
        expect(userThatWasNotChanged[0].refreshedAt).toEqual(expect.any(Date))
      })
    )
  })
})
