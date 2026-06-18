import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  dismissNotificationAsync,
  getPresentedNotificationsAsync,
  type Notification,
} from 'expo-notifications'
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

// On Android the FCM data payload is exposed under the push trigger's
// remoteMessage, on iOS the data lives directly on the content data field. We
// validate both shapes instead of relying on library internals.
const AndroidRemoteMessageBody = Schema.Struct({
  request: Schema.Struct({
    trigger: Schema.Struct({
      remoteMessage: Schema.Struct({
        data: Schema.Struct({
          body: Schema.String,
        }),
      }),
    }),
  }),
})

const extractChatNoticeBody = (
  n: Notification
): Option.Option<typeof NewChatMessageNoticeNotificationData.Type> => {
  if (Platform.OS === 'android') {
    return pipe(
      Schema.decodeUnknownOption(AndroidRemoteMessageBody)(n),
      Option.flatMap((parsed) =>
        Schema.decodeOption(
          Schema.parseJson(NewChatMessageNoticeNotificationData)
        )(parsed.request.trigger.remoteMessage.data.body)
      )
    )
  }

  return Schema.decodeUnknownOption(NewChatMessageNoticeNotificationData)(
    n.request.content.data?.body
  )
}

const isPlaceholderNotificationForChat = (
  n: Notification
): Option.Option<SystemNotificationId> => {
  const chatMessageNotificationO = extractChatNoticeBody(n)
  if (
    Option.isSome(chatMessageNotificationO) &&
    chatMessageNotificationO.value.includesSystemNotification
  ) {
    return Schema.decodeOption(SystemNotificationId)(n.request.identifier)
  }

  return Option.none()
}

const getNonReportedSystemNotificationsIdsActionAtom = atom(
  null,
  (get, set, allNotifications: Notification[]) => {
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
    await getPresentedNotificationsAsync()
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

  Array.forEach(notificationIdsToCancel, (n) => {
    void dismissNotificationAsync(n)
  })
}
