import {SqlClient} from '@effect/sql'
import {Array, Effect, Logger, LogLevel, Order, pipe} from 'effect'
import {isArray} from 'effect/Array'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from '../../__tests__/routes/contacts/utils'
import {sendNotificationsMock} from '../../__tests__/utils/mockedExpoNotificationService'
import {runPromiseInMockedEnvironment} from '../../__tests__/utils/runPromiseInMockedEnvironment'
import {processNewContentNotifications} from './processNewContentNotifications'

let user1: DummyUser
let user2: DummyUser
let user3: DummyUser

describe('process new content notification', () => {
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
  it('Users should be notified about new conent notification', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        yield* _(Effect.sleep(100)) // Send notifications mock is called asynchronously, so thats whiy the sleep
        sendNotificationsMock.mockClear()

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = now() - interval '4 days',
            last_new_content_notification_sent_at = now() - interval '4 days'
          WHERE
            ${sql.in('hash', [user1.hashedNumber, user2.hashedNumber])}
        `)

        yield* _(sql`
          UPDATE users
          SET
            refreshed_at = now() - interval '3 days',
            last_new_content_notification_sent_at = now() - interval '3 days'
          WHERE
            hash = ${user3.hashedNumber}
        `)

        yield* _(processNewContentNotifications)

        expect(sendNotificationsMock).toHaveBeenCalledTimes(1)

        const call = sendNotificationsMock.mock.calls[0][0]
        expect(call[0].data?.type).toEqual('NEW_CONTENT')
        expect(
          pipe(
            call.map((one) => (isArray(one.to) ? one.to : [one.to])),
            Array.flatten,
            Array.sort(Order.string),
            Array.join(',')
          )
        ).toEqual(
          pipe(
            [user1.notificationToken, user2.notificationToken],
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })
})
