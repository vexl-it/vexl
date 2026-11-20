import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Array, Effect, Option, pipe, Schema} from 'effect'
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
import {generateAnotherNumber} from './utils/multipleNumbers'
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
          notificationService.notifyOthersAboutNewUser(
            [sharedContact.serverHashedNumber],
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
