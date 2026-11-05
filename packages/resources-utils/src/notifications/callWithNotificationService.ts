import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Duration, Effect} from 'effect'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'

// Bounds the background notification request, so it cannot hang forever.
const NOTIFICATION_TIMEOUT = Duration.seconds(30)

interface NotificationArgs {
  notificationToken?: VexlNotificationToken | undefined
  notificationApi: Pick<NotificationApi, 'issueNotification'>
  sendSystemNotification: boolean
}

export function callWithNotificationService<
  T extends object,
  L extends {notificationHandled: boolean},
  R,
>(
  f: (arg: T) => Effect.Effect<L, R>,
  fArgs: Omit<T, 'notificationServiceReady'>
): (args: NotificationArgs) => Effect.Effect<L, R> {
  return ({notificationApi, notificationToken, sendSystemNotification}) => {
    return Effect.gen(function* (_) {
      if (!notificationToken) {
        return yield* _(f({...(fArgs as T), notificationServiceReady: false}))
      }

      const result = yield* _(
        f({...(fArgs as T), notificationServiceReady: true})
      )
      if (result.notificationHandled) {
        return result
      }

      // The message is already delivered, so the caller does not wait for
      // the best effort notification.
      yield* _(
        Effect.forkDaemon(
          notificationApi
            .issueNotification({
              notificationToken,
              sendNewChatMessageNotification: sendSystemNotification,
            })
            .pipe(
              Effect.timeout(NOTIFICATION_TIMEOUT),
              Effect.catchAll((e) =>
                Effect.sync(() => {
                  reportErrorFromResourcesUtils(
                    'warn',
                    new Error('Error issuing notificiation'),
                    {e}
                  )
                })
              )
            )
        )
      )

      return result
    })
  }
}
