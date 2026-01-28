import {Socket} from '@effect/platform'
import {RpcClient, RpcSerialization} from '@effect/rpc'
import notifee, {AndroidImportance} from '@notifee/react-native'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  type ClubExpiredNoticeMessage,
  type ClubFlaggedNoticeMessage,
  type NewChatMessageNoticeMessage,
  type NewClubUserNoticeMessage,
  type NewUserNoticeMessage,
  type NotificationStreamMessage,
  Rpcs,
  type StreamOnlyChatMessage,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {
  Array,
  Console,
  Effect,
  Fiber,
  Layer,
  Match,
  Option,
  Schedule,
  Stream,
} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom, getApiPreset} from '../../api'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {processStreamOnlyNotificationActionAtom} from '../../state/chat/atoms/processStreamOnlyChatMessage'
import {checkForClubsAdmissionActionAtom} from '../../state/clubs/atom/checkForClubsAdmissionActionAtom'
import {
  syncAllClubsHandleStateWhenNotFoundActionAtom,
  syncSingleClubHandleStateWhenNotFoundActionAtom,
} from '../../state/clubs/atom/refreshClubsActionAtom'
import {
  addReasonToRemovedClubActionAtom,
  createSingleRemovedClubAtom,
  markRemovedClubAsNotifiedActionAtom,
} from '../../state/clubs/atom/removedClubsAtom'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {getKeyHolderForNotificationTokenOrCypherActionAtom} from '../../state/notifications/fcmCypherToKeyHolderAtom'
import {reportNewConnectionNotificationForked} from '../../state/notifications/reportNewConnectionNotification'
import {vexlNotificationTokenAtom} from '../../state/notifications/vexlNotificationTokenAtom'
import {platform, versionCode} from '../environment'
import {translationAtom} from '../localization/I18nProvider'
import {notificationPreferencesAtom} from '../preferences'
import {reportErrorE} from '../reportError'
import {useAppState} from '../useAppState'
import {getDefaultChannel} from './notificationChannels'

const WebSocketConstructorLive = Layer.succeed(
  Socket.WebSocketConstructor,
  (url, protocol) => new WebSocket(url, protocol) as any
)

// Choose which protocol to use
const ProtocoSocketLive = RpcClient.layerProtocolSocket({
  retryTransientErrors: true,
}).pipe(
  Layer.provide([
    Socket.layerWebSocket(`${getApiPreset().notificationMs}/rpc`).pipe(
      Layer.provide(WebSocketConstructorLive)
    ),
    RpcSerialization.layerNdjson,
  ])
)

const makeClient = RpcClient.make(Rpcs)

const processNewChatMessageActionAtom = atom(
  null,
  (get, set, message: NewChatMessageNoticeMessage | StreamOnlyChatMessage) =>
    Effect.gen(function* (_) {
      const cypher = message.targetToken ?? message.targetCypher
      const inboxForCypher = set(
        getKeyHolderForNotificationTokenOrCypherActionAtom,
        cypher
      )
      if (!inboxForCypher) {
        yield* _(
          reportErrorE(
            'warn',
            new Error(
              'Error decrypting notification from stream - unable to find private key for cypher'
            )
          )
        )
        return
      }

      if (message._tag === 'NewChatMessageNoticeMessage') {
        yield* _(
          Console.log('📩 Processing chat message notification from stream')
        )
        yield* _(
          set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
            key: inboxForCypher.publicKeyPemBase64,
          })
        )
      } else if (message._tag === 'StreamOnlyChatMessage') {
        const inbox = Array.findFirst(
          get(messagingStateAtom),
          (i) =>
            i.inbox.privateKey.publicKeyPemBase64 ===
            inboxForCypher.publicKeyPemBase64
        )
        if (Option.isNone(inbox)) {
          yield* _(
            reportErrorE(
              'warn',
              new Error(
                'WTF? Got inbox key from keyHolderForNotificaitonCypherActionAtom but no matching inbox in state'
              )
            )
          )
          return
        }

        yield* _(
          set(processStreamOnlyNotificationActionAtom, {
            message,
            inbox: inbox.value,
          })
        )
      }
    })
)

const processNewUserNotificationActionAtom = atom(
  null,
  (get, set, message: NewUserNoticeMessage) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)

      yield* _(
        reportNewConnectionNotificationForked(
          api.metrics,
          Option.some(message.trackingId)
        )
      )
      yield* _(set(syncConnectionsActionAtom))
      yield* _(
        set(updateAndReencryptAllOffersConnectionsActionAtom, {
          isInBackground: false,
        })
      )
    })
)

const processNewClubConnectionNotificationActionAtom = atom(
  null,
  (get, set, message: NewClubUserNoticeMessage) =>
    Effect.gen(function* (_) {
      yield* _(
        set(syncAllClubsHandleStateWhenNotFoundActionAtom, {
          updateOnlyUuids: [message.clubUuid],
        })
      )

      yield* _(
        set(updateAndReencryptAllOffersConnectionsActionAtom, {
          isInBackground: false,
        })
      )
    })
)

const processUserAdmittedToClubNotificationActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    yield* _(set(checkForClubsAdmissionActionAtom))
  })
)

const processClubExpiredOrFlaggedNotificationActionAtom = atom(
  null,
  (get, set, message: ClubExpiredNoticeMessage | ClubFlaggedNoticeMessage) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)

      yield* _(
        set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
          clubUuid: message.clubUuid,
        }).pipe(
          Effect.catchAll((e) => {
            if (
              e._tag === 'ClubNotFoundError' ||
              e._tag === 'FetchingClubError' ||
              e._tag === 'NoSuchElementException'
            )
              return Effect.succeed(Effect.void)

            return Effect.fail(e)
          })
        )
      )

      const reason =
        message._tag === 'ClubExpiredNoticeMessage' ? 'EXPIRED' : 'FLAGGED'

      set(addReasonToRemovedClubActionAtom, {
        clubUuid: message.clubUuid,
        reason,
      })

      yield* _(
        Effect.log(
          `📳 Received notification about club deactivation ${message.clubUuid}`
        )
      )

      const clubInfo = get(createSingleRemovedClubAtom(message.clubUuid))

      if (clubInfo) {
        yield* _(
          Effect.promise(async () => {
            await notifee.displayNotification({
              title: t(`notifications.CLUB_DEACTIVATED.${reason}.title`),
              body: t(`notifications.CLUB_DEACTIVATED.${reason}.body`, {
                name: clubInfo.clubInfo.name,
              }),
              android: {
                smallIcon: 'notification_icon',
                channelId: await getDefaultChannel(),
                pressAction: {
                  id: 'default',
                },
              },
            })
          })
        )

        set(markRemovedClubAsNotifiedActionAtom, {
          clubUuid: message.clubUuid,
        })
      }
    })
)

const processUserInactivityNotificationActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const {t} = get(translationAtom)
    const notificationPreferences = get(notificationPreferencesAtom)

    if (!notificationPreferences.inactivityWarnings) {
      yield* _(
        Effect.log(
          'Received inactivity reminder notification but INACTIVITY_REMINDER notifications are disabled. Not showing notification.'
        )
      )
      return true
    }

    yield* _(
      Effect.promise(async () => {
        await notifee.displayNotification({
          title: t(`notifications.INACTIVITY_REMINDER.title`),
          body: t(`notifications.INACTIVITY_REMINDER.body`),
          // data,
          android: {
            smallIcon: 'notification_icon',
            channelId: await getDefaultChannel(),
            pressAction: {
              id: 'default',
            },
          },
        })
      })
    )
  })
)

const processUserLoginOnDifferentDeviceNotificationActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* (_) {
      const {t} = get(translationAtom)

      yield* _(
        Effect.promise(async () => {
          await notifee.displayNotification({
            title: t('notifications.loggingOnDifferentDevice.title'),
            body: t('notifications.loggingOnDifferentDevice.body'),
            // data,
            android: {
              smallIcon: 'notification_icon',
              channelId: await getDefaultChannel(),
              importance: AndroidImportance.HIGH,
              lightUpScreen: true,
              pressAction: {
                id: 'default',
              },
            },
          })
        })
      )
    })
)

const processNewStreamNotificationActionAtom = atom(
  null,
  (get, set, message: NotificationStreamMessage) =>
    Effect.gen(function* (_) {
      if (message._tag === 'DebugMessage') {
        yield* _(
          Console.debug('Received debug message from notification stream')
        )
        return
      }

      yield* _(
        Match.value(message).pipe(
          Match.tag('NewChatMessageNoticeMessage', (m) =>
            set(processNewChatMessageActionAtom, m)
          ),
          Match.tag('StreamOnlyChatMessage', (m) =>
            set(processNewChatMessageActionAtom, m)
          ),
          Match.tag('NewUserNoticeMessage', (m) =>
            set(processNewUserNotificationActionAtom, m)
          ),
          Match.tag('NewClubUserNoticeMessage', (m) =>
            set(processNewClubConnectionNotificationActionAtom, m)
          ),
          Match.tag('UserAdmittedToClubNoticeMessage', () =>
            set(processUserAdmittedToClubNotificationActionAtom)
          ),
          Match.tag('ClubExpiredNoticeMessage', (m) =>
            set(processClubExpiredOrFlaggedNotificationActionAtom, m)
          ),
          Match.tag('ClubFlaggedNoticeMessage', (m) =>
            set(processClubExpiredOrFlaggedNotificationActionAtom, m)
          ),
          Match.tag('UserInactivityNoticeMessage', () =>
            set(processUserInactivityNotificationActionAtom)
          ),
          Match.tag('UserLoginOnDifferentDeviceNoticeMessage', () =>
            set(processUserLoginOnDifferentDeviceNotificationActionAtom)
          ),
          Match.tag('NewContentNoticeMessage', () => Effect.void),
          Match.exhaustive
        )
      )

      yield* _(Console.log('Received notification stream message', message))
    }).pipe(
      Effect.exit,
      Effect.tap((e) => {
        if (e._tag === 'Success')
          return Console.log(
            '✅ Processed notification stream message',
            JSON.stringify(message, null, 2)
          )
        return reportErrorE(
          'error',
          new Error(
            `Error processing notification stream message: ${JSON.stringify(e)}`
          ),
          {e}
        )
      })
    )
)

const startListeningToNotificationStreamActionAtom = atom(
  null,
  (get, set, notificationSecret: VexlNotificationTokenSecret) =>
    Effect.gen(function* (_) {
      const rpc = yield* _(makeClient)
      return yield* rpc
        .listenToNotifications({
          notificationToken: notificationSecret,
          platform,
          version: versionCode,
        })
        .pipe(
          Stream.runForEach((streamNotification) =>
            set(processNewStreamNotificationActionAtom, streamNotification)
          ),
          Effect.exit,
          Effect.tap((e) =>
            Console.log(
              'Notification stream ended. Retrying...',
              JSON.stringify(e, null, 2)
            )
          ),
          Effect.repeat({
            schedule: __DEV__
              ? Schedule.spaced(1000) // In dev retry quickly
              : Schedule.exponential(1000).pipe(Schedule.jittered), // In prod exponential backoff with jitter to prevent thundering herd
          })
        )
    }).pipe(
      Effect.scoped,
      Effect.provide(ProtocoSocketLive),
      Effect.runFork,
      (fiber) => () => {
        Effect.runFork(Fiber.interrupt(fiber))
      }
    )
)

export function useConsumeNotificationStream(): void {
  const startListeningToNotificationStream = useSetAtom(
    startListeningToNotificationStreamActionAtom
  )

  const {secret} = useAtomValue(vexlNotificationTokenAtom)

  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        if (!secret) return
        return startListeningToNotificationStream(secret)
      },
      [startListeningToNotificationStream, secret]
    )
  )
}
