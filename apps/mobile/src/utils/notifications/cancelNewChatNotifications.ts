import Notifee, {type DisplayedNotification} from '@notifee/react-native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {atom, getDefaultStore} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {Platform} from 'react-native'
import {areNotificationsEnabledE} from '.'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {reportErrorE} from '../reportError'

const SystemNotificationId = Schema.String.pipe(
  Schema.brand('SystemNotificationId')
)
type SystemNotificationId = typeof SystemNotificationId.Type

const alreadyReportedNotificationsIdsStorageAtom = atomWithParsedMmkvStorage(
  'alreadyReportedNotificationsIds',
  {alreadyReportedIds: []},
  Schema.Struct({
    alreadyReportedIds: Schema.Array(SystemNotificationId),
  })
)

const alreadyReportedNotificationsIdsAtom = focusAtom(
  alreadyReportedNotificationsIdsStorageAtom,
  (o) => o.prop('alreadyReportedIds')
)

const isPlaceholderNotificationForChat = (
  n: DisplayedNotification
): Option.Option<SystemNotificationId> => {
  // On Android we dont have data field available, so just remove all the FCM tokens
  if (Platform.OS === 'android') {
    if (
      n.notification.id === '0' &&
      n.notification.android?.tag &&
      (n.notification.android?.tag?.startsWith(`FCM-`) ?? false)
    )
      return Schema.decodeOption(SystemNotificationId)(
        n.notification.android.tag
      )
  }

  const chatMessageNotificationO = Schema.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )(n.notification.data?.body)
  if (
    Option.isSome(chatMessageNotificationO) &&
    chatMessageNotificationO.value.includesSystemNotification
  ) {
    return pipe(
      Option.fromNullable(n.id),
      Option.flatMap(Schema.decodeOption(SystemNotificationId))
    )
  }

  return Option.none()
}

const getNonReportedSystemNotificationsIdsActionAtom = atom(
  null,
  (get, set, allNotifications: DisplayedNotification[]) => {
    const systemNotificationsIds = Array.filterMap(
      allNotifications,
      isPlaceholderNotificationForChat
    )
    const reportedIds = get(alreadyReportedNotificationsIdsAtom)
    const notReportedIds = Array.difference(systemNotificationsIds, reportedIds)

    set(alreadyReportedNotificationsIdsAtom, systemNotificationsIds)
    return notReportedIds
  }
)

export async function cancelNewChatNotifications(): Promise<void> {
  const {metrics} = getDefaultStore().get(apiAtom)

  const notificationIdsToCancel = getDefaultStore().set(
    getNonReportedSystemNotificationsIdsActionAtom,
    await Notifee.getDisplayedNotifications()
  )

  if (!Array.isNonEmptyArray(notificationIdsToCancel)) return

  Effect.gen(function* (_) {
    const notificationsEnabled = yield* _(
      areNotificationsEnabledE(),
      Effect.option
    )
    yield* _(
      metrics
        .reportNotificationInteraction({
          count: notificationIdsToCancel.length,
          notificationType: 'Chat',
          type: 'UINotificationReceived',
          uuid: generateUuid(),
          ...(Option.isSome(notificationsEnabled)
            ? {
                notificationsEnabled: notificationsEnabled.value.notifications,
                backgroundTaskEnabled:
                  notificationsEnabled.value.backgroundTasks,
              }
            : {}),
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
          )
        )
    )
  }).pipe(Effect.runFork)

  if (Platform.OS === 'android') {
    Array.forEach(notificationIdsToCancel, (n) => {
      void Notifee.cancelNotification('0', n)
    })
  } else {
    Array.forEach(notificationIdsToCancel, (n) => {
      void Notifee.cancelNotification(n)
    })
  }
}
