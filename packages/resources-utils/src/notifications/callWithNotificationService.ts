import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Duration, Effect} from 'effect'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'

// The message is already delivered, so a hanging notification must not hold
// the caller back.
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

      yield* _(
        notificationApi.issueNotification({
          notificationToken,
          sendNewChatMessageNotification: sendSystemNotification,
        })
      ).pipe(
        Effect.timeout(NOTIFICATION_TIMEOUT),
        Effect.catchAll((e) => {
          reportErrorFromResourcesUtils(
            'warn',
            new Error('Error issuing notificiation'),
            {e}
          )
          return Effect.succeed(result)
        })
      )

      return result
    })
  }
}
