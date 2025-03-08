import Notifee, {type DisplayedNotification} from '@notifee/react-native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {Array, Option, pipe, Schema} from 'effect'
import {isNotUndefined} from 'effect/Predicate'
import {Platform} from 'react-native'

const isPlaceholderNotificationForChat =
  (cypher: NotificationCypher) =>
  (n: DisplayedNotification): boolean => {
    if (Platform.OS === 'android') {
      return (
        n.notification.id === '0' &&
        (n.notification.android?.tag?.startsWith(`FCM-`) ?? false)
      )
    }

    const chatMessageNotificationO = Schema.decodeUnknownOption(
      NewChatMessageNoticeNotificationData
    )(n.notification.data?.body)
    return (
      Option.isSome(chatMessageNotificationO) &&
      chatMessageNotificationO.value.includesSystemNotification === 'true' &&
      chatMessageNotificationO.value.targetCypher === cypher
    )
  }

export async function cancelNewChatNotifications(
  cypher: NotificationCypher
): Promise<void> {
  const notificationIdsToCancel = pipe(
    await Notifee.getDisplayedNotifications(),
    Array.filter(isPlaceholderNotificationForChat(cypher)), // TODO refine this!
    Array.filter(isNotUndefined)
  )

  Array.forEach(notificationIdsToCancel, (n) => {
    if (n.id === undefined) return
    if (
      Platform.OS === 'android' &&
      n.notification.android?.tag?.startsWith('FCM-')
    ) {
      void Notifee.cancelNotification(n.id, n.notification.android.tag)
    } else {
      void Notifee.cancelNotification(n.id)
    }
  })
}
