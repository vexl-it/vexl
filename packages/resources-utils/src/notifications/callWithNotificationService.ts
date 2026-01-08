import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  isVexlNotificationToken,
  type VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  SemverString,
  compare,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, Schema} from 'effect'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'

const FE_VERSION_SUPPORTING_V2_NOTIFICATIONS =
  Schema.decodeSync(SemverString)('1.17.0')

// Union type for notification token - accepts both legacy cypher and new vexl token
export type NotificationTokenOrCypher =
  | NotificationCypher
  | VexlNotificationToken

interface NotificationArgs {
  otherSideVersion?: SemverString | undefined
  // todo #2124 - remove cypher option
  notificationCypher?: NotificationTokenOrCypher | undefined
  notificationApi: NotificationApi
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
  return ({
    notificationApi,
    notificationCypher,
    otherSideVersion,
    sendSystemNotification,
  }) => {
    return Effect.gen(function* (_) {
      // Do not try to issue notification if there is no fcmCypher or the other side does not support V2 notifications
      if (
        !notificationCypher ||
        !otherSideVersion ||
        compare(otherSideVersion)('<', FE_VERSION_SUPPORTING_V2_NOTIFICATIONS)
      ) {
        return yield* _(f({...(fArgs as T), notificationServiceReady: false}))
      }

      const result = yield* _(
        f({...(fArgs as T), notificationServiceReady: true})
      )
      if (result.notificationHandled) {
        return result
      }

      const notificationToken = isVexlNotificationToken(notificationCypher)
        ? notificationCypher
        : undefined

      yield* _(
        notificationApi.issueNotification({
          notificationCypher: notificationToken
            ? undefined
            : notificationCypher,
          notificationToken,
          sendNewChatMessageNotification: sendSystemNotification,
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
