import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
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

const decodeChatNoticeBody = (
  data: unknown
): Option.Option<typeof NewChatMessageNoticeNotificationData.Type> => {
  if (typeof data === 'string') {
    return Schema.decodeOption(
      Schema.parseJson(NewChatMessageNoticeNotificationData)
    )(data)
  }

  return Schema.decodeUnknownOption(NewChatMessageNoticeNotificationData)(data)
}

const extractChatNoticeBody = (
  n: Notification
): Option.Option<typeof NewChatMessageNoticeNotificationData.Type> => {
  if (Platform.OS === 'android') {
    return pipe(
      Schema.decodeUnknownOption(AndroidRemoteMessageBody)(n),
      Option.flatMap((parsed) =>
        decodeChatNoticeBody(parsed.request.trigger.remoteMessage.data.body)
      )
    )
  }

  // On iOS the chat-notice payload lives directly on content.data.
  return decodeChatNoticeBody(n.request.content.data)
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

const isPlaceholderNotificationForChatTargetTokens =
  (targetTokens: readonly VexlNotificationToken[]) =>
  (n: Notification): Option.Option<SystemNotificationId> => {
    const chatMessageNotificationO = extractChatNoticeBody(n)
    if (Option.isNone(chatMessageNotificationO)) return Option.none()

    const {targetToken} = chatMessageNotificationO.value
    if (!targetToken) return Option.none()

    if (
      chatMessageNotificationO.value.includesSystemNotification &&
      Array.contains(targetTokens, targetToken)
    ) {
      return Schema.decodeOption(SystemNotificationId)(n.request.identifier)
    }

    return Option.none()
  }

const getSystemNotificationsIdsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      allNotifications,
      filterNotification,
    }: {
      allNotifications: Notification[]
      filterNotification: (
        n: Notification
      ) => Option.Option<SystemNotificationId>
    }
  ) => {
    const systemNotificationsIds = Array.filterMap(
      allNotifications,
      filterNotification
    )
    const allSystemNotificationsIds = Array.filterMap(
      allNotifications,
      isPlaceholderNotificationForChat
    )
    const reportedIds = get(alreadyReportedNotificationsIdsAtom)
    const notReportedIds = Array.difference(systemNotificationsIds, reportedIds)

    set(
      alreadyReportedNotificationsIdsAtom,
      Array.union(
        Array.intersection(reportedIds, allSystemNotificationsIds),
        systemNotificationsIds
      )
    )
    return {
      idsToCancel: systemNotificationsIds,
      idsToReport: notReportedIds,
    }
  }
)

async function cancelNewChatNotificationsMatching({
  filterNotification,
}: {
  filterNotification: (n: Notification) => Option.Option<SystemNotificationId>
}): Promise<void> {
  const {metrics} = getDefaultStore().get(apiAtom)

  const {idsToCancel, idsToReport} = getDefaultStore().set(
    getSystemNotificationsIdsActionAtom,
    {
      allNotifications: await getPresentedNotificationsAsync(),
      filterNotification,
    }
  )

  if (Array.isNonEmptyArray(idsToReport)) {
    Effect.gen(function* (_) {
      const notificationsEnabled = yield* _(
        areNotificationsEnabledE(),
        Effect.option
      )
      yield* _(
        metrics
          .reportNotificationInteraction({
            count: idsToReport.length,
            notificationType: 'Chat',
            type: 'UINotificationReceived',
            uuid: generateUuid(),
            ...(Option.isSome(notificationsEnabled)
              ? {
                  notificationsEnabled:
                    notificationsEnabled.value.notifications,
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
  }

  Array.forEach(idsToCancel, (n) => {
    void dismissNotificationAsync(n)
  })
}

export async function cancelNewChatNotifications(): Promise<void> {
  await cancelNewChatNotificationsMatching({
    filterNotification: isPlaceholderNotificationForChat,
  })
}

export async function cancelNewChatNotificationsForTargetTokens(
  targetTokens: readonly VexlNotificationToken[]
): Promise<void> {
  // iOS-only is enforced at the call sites (the only place generic system
  // notifications exist); here we just skip the empty case.
  if (!Array.isNonEmptyReadonlyArray(targetTokens)) return

  await cancelNewChatNotificationsMatching({
    filterNotification:
      isPlaceholderNotificationForChatTargetTokens(targetTokens),
  })
}
