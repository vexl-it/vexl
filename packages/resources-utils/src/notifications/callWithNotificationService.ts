import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
import * as SemverString from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'

const FE_VERSION_SUPPORTING_V2_NOTIFICATIONS =
  SemverString.SemverString.parse('1.17.0')

interface NotificationArgs {
  otherSideVersion?: SemverString.SemverString | undefined
  fcmCypher?: FcmCypher | undefined
  notificationApi: NotificationApi
}

export function callWithNotificationService<
  T extends object,
  L extends {notificationHandled: boolean},
  R,
>(
  f: (arg: T) => Effect.Effect<L, R>,
  fArgs: Omit<T, 'notificationServiceReady'>
): (args: NotificationArgs) => Effect.Effect<L, R> {
  return ({notificationApi, fcmCypher, otherSideVersion}) => {
    return Effect.gen(function* (_) {
      // Do not try to issue notification if there is no fcmCypher or the other side does not support V2 notifications
      if (
        !fcmCypher ||
        !otherSideVersion ||
        SemverString.compare(otherSideVersion)(
          '<',
          FE_VERSION_SUPPORTING_V2_NOTIFICATIONS
        )
      ) {
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
          body: {
            fcmCypher,
          },
        })
      ).pipe(
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
