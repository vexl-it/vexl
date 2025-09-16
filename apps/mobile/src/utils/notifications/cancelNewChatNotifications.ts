import Notifee, {type DisplayedNotification} from '@notifee/react-native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {isNotUndefined} from 'effect/Predicate'
import {getDefaultStore} from 'jotai'
import {Platform} from 'react-native'
import {apiAtom} from '../../api'
import {reportErrorE} from '../reportError'

const isPlaceholderNotificationForChat =
  () =>
  (n: DisplayedNotification): boolean => {
    // On Android we dont have data field available, so just remove all the FCM tokens
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
      chatMessageNotificationO.value.includesSystemNotification
    )
  }

export async function cancelNewChatNotifications(): Promise<void> {
  const {metrics} = getDefaultStore().get(apiAtom)

  const notificationIdsToCancel = pipe(
    await Notifee.getDisplayedNotifications(),
    Array.filter(isPlaceholderNotificationForChat()),
    Array.filter(isNotUndefined)
  )
  if (notificationIdsToCancel.length > 0)
    metrics
      .reportNotificationInteraction({
        count: notificationIdsToCancel.length,
        notificationType: 'Chat',
        type: 'UINotificationReceived',
        uuid: generateUuid(),
      })
      .pipe(
        Effect.timeout(500),
        Effect.retry({times: 3}),
        Effect.tapError((e) =>
          reportErrorE(
            'warn',
            new Error(
              'Error while sending UI notification received to metrics service'
            ),
            {
              e,
            }
          )
        ),
        Effect.runFork
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
