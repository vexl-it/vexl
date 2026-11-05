import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Deferred, Effect, Schema} from 'effect'
import {callWithNotificationService} from './callWithNotificationService'

jest.mock('../reportErrorFromResourcesUtils', () => ({
  __esModule: true,
  default: () => {},
}))

const sentMessage = {notificationHandled: false, receivedByServerAt: 500}

describe('callWithNotificationService', () => {
  it('returns the delivered result without waiting for the notification', async () => {
    const notificationAnswer = Effect.runSync(Deferred.make<never>())
    const issueNotification = jest.fn(() => Deferred.await(notificationAnswer))
    const hangingNotificationApi: Pick<NotificationApi, 'issueNotification'> = {
      issueNotification,
    }

    const result = await Effect.runPromise(
      callWithNotificationService(
        (_: {notificationServiceReady: boolean}) => Effect.succeed(sentMessage),
        {}
      )({
        notificationToken: Schema.decodeSync(VexlNotificationToken)(
          'vexl_nt_test'
        ),
        notificationApi: hangingNotificationApi,
        sendSystemNotification: true,
      }).pipe(Effect.timeout('1 second'))
    )

    expect(result).toBe(sentMessage)
    expect(issueNotification).toHaveBeenCalledTimes(1)
    // Ends the background notification so it does not outlive the test.
    await Effect.runPromise(Deferred.interrupt(notificationAnswer))
  })
})
