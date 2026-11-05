import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, Schema} from 'effect'
import {callWithNotificationService} from './callWithNotificationService'

jest.mock('../reportErrorFromResourcesUtils', () => ({
  __esModule: true,
  default: () => {},
}))

const sentMessage = {notificationHandled: false, receivedByServerAt: 500}

describe('callWithNotificationService', () => {
  it('returns the delivered result when the notification request hangs', async () => {
    jest.useFakeTimers()
    try {
      const hangingNotificationApi: Pick<NotificationApi, 'issueNotification'> =
        {issueNotification: () => Effect.never}

      const call = Effect.runPromise(
        callWithNotificationService(
          (_: {notificationServiceReady: boolean}) =>
            Effect.succeed(sentMessage),
          {}
        )({
          notificationToken: Schema.decodeSync(VexlNotificationToken)(
            'vexl_nt_test'
          ),
          notificationApi: hangingNotificationApi,
          sendSystemNotification: true,
        })
      )

      await jest.advanceTimersByTimeAsync(30_000)
      await expect(call).resolves.toBe(sentMessage)
    } finally {
      jest.useRealTimers()
    }
  })
})
