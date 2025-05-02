import notifee from '@notifee/react-native'
import {useNavigation} from '@react-navigation/native'
import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Effect, Option, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import {useSetAtom, useStore} from 'jotai'
import {useEffect} from 'react'
import {AppState, Platform} from 'react-native'
import {translationAtom} from '../utils/localization/I18nProvider'
import {extractDataPayloadFromNotification} from '../utils/notifications/extractDataFromNotification'
import {getDefaultChannel} from '../utils/notifications/notificationChannels'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from '../utils/notifications/showUINotificationFromRemoteMessage'
import reportError from '../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from './chat/atoms/fetchNewMessagesActionAtom'
import {checkForClubsAdmissionActionAtom} from './clubs/atom/checkForClubsAdmissionActionAtom'
import {
  syncAllClubsHandleStateWhenNotFoundActionAtom,
  syncSingleClubHandleStateWhenNotFoundActionAtom,
} from './clubs/atom/refreshClubsActionAtom'
import {
  addReasonToRemovedClubActionAtom,
  createSingleRemovedClubAtom,
  markRemovedClubAsNotifiedActionAtom,
} from './clubs/atom/removedClubsAtom'
import {syncConnectionsActionAtom} from './connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from './notifications/processChatNotification'

export function useHandleReceivedNotifications(): void {
  const navigation = useNavigation()
  const store = useStore()
  const fetchMessagesForInbox = useSetAtom(fetchAndStoreMessagesForInboxAtom)
  const updateOffersConnections = useSetAtom(
    updateAndReencryptAllOffersConnectionsActionAtom
  )
  const checkForClubAdmission = useSetAtom(checkForClubsAdmissionActionAtom)

  const syncConnections = useSetAtom(syncConnectionsActionAtom)
  const updateClubs = useSetAtom(syncAllClubsHandleStateWhenNotFoundActionAtom)

  useEffect(() => {
    const processNotification = async (
      remoteMessage: Notifications.Notification
    ): Promise<void> => {
      const notificationPayloadO = extractDataPayloadFromNotification({
        source: 'hook',
        data: remoteMessage,
      })

      if (Option.isNone(notificationPayloadO)) {
        console.info(
          ` 🔔 ‼️ Hook notification and unable to parse ${JSON.stringify(
            remoteMessage,
            null,
            2
          )}`
        )
        void showDebugNotificationIfEnabled({
          title: `Unable to parse notification`,
          subtitle: 'notifInHook',
          body: JSON.stringify(
            {
              data: remoteMessage.request.content,
            },
            null,
            2
          ),
        })
        return
      }

      const {payload, isHeadless} = notificationPayloadO.value

      console.info(
        `🔔 Received notification in hook. Is headless: ${isHeadless}`,
        JSON.stringify(payload, null, 2)
      )

      if (Platform.OS === 'android' && AppState.currentState !== 'active') {
        console.info(
          '🔔 Received notification in not active state. Should be handled by background task'
        )
        void showDebugNotificationIfEnabled({
          title: 'Received notification in not active state',
          body: `Should be handled by background task`,
          subtitle: 'notifInHook',
        })
        return
      }

      const newChatMessageNoticeNotificationDataOption =
        NewChatMessageNoticeNotificationData.parseUnkownOption(payload)

      if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
        console.info('🔔 Received notification about new chat message')
        await store.set(
          processChatNotificationActionAtom,
          newChatMessageNoticeNotificationDataOption.value
        )()
        return
      }

      const handled = await showUINotificationFromRemoteMessage(payload)
      if (handled) {
        console.info('🔔 Handled notification in UI')
        return
      }
      const isNewSocialNetworkConnectionNotification = Option.isSome(
        Schema.decodeUnknownOption(NewSocialNetworkConnectionNotificationData)(
          payload
        )
      )
      if (isNewSocialNetworkConnectionNotification) {
        console.info(
          '🔔 Received notification about new user. Checking and updating offers accordingly.'
        )
        await Effect.runPromise(syncConnections())
        await Effect.runPromise(
          updateOffersConnections({isInBackground: false})
        )
        return
      }

      const newClubConnectionNotificationO = Schema.decodeUnknownOption(
        NewClubConnectionNotificationData
      )(payload)
      if (Option.isSome(newClubConnectionNotificationO)) {
        console.info(
          `🔔 Received notification about new user in club ${newClubConnectionNotificationO.value.clubUuids.join(',')}. Checking and updating offers accordingly.`
        )
        await Effect.runPromise(
          updateClubs({
            updateOnlyUuids: newClubConnectionNotificationO.value.clubUuids,
          })
        )
        await Effect.runPromise(
          updateOffersConnections({isInBackground: false})
        )
        return
      }

      const admitedToClubNetworkNotificationDataO = Schema.decodeUnknownOption(
        AdmitedToClubNetworkNotificationData
      )(payload)
      if (Option.isSome(admitedToClubNetworkNotificationDataO)) {
        console.info(
          `🔔 Received notification about new user in club ${admitedToClubNetworkNotificationDataO.value.publicKey}`
        )
        await Effect.runPromise(checkForClubAdmission())
        return
      }

      const ClubDeactivatedNotificationDataO = Schema.decodeUnknownOption(
        ClubDeactivatedNotificationData
      )(payload)
      if (Option.isSome(ClubDeactivatedNotificationDataO)) {
        const {t} = store.get(translationAtom)
        await Effect.runPromise(
          store.set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
            clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
          })
        )

        store.set(addReasonToRemovedClubActionAtom, {
          clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
          reason: ClubDeactivatedNotificationDataO.value.reason,
        })

        console.info(
          `📳 Received notification about club deactivation ${ClubDeactivatedNotificationDataO.value.clubUuid}`
        )
        const clubInfo = store.get(
          createSingleRemovedClubAtom(
            ClubDeactivatedNotificationDataO.value.clubUuid
          )
        )
        if (clubInfo) {
          await notifee.displayNotification({
            title: t(
              `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.title`
            ),
            body: t(
              `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.body`,
              {name: clubInfo.clubInfo.name}
            ),
            android: {
              channelId: await getDefaultChannel(),
              pressAction: {
                id: 'default',
              },
            },
          })

          store.set(markRemovedClubAsNotifiedActionAtom, {
            clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
          })
        }

        return
      }

      reportError('warn', new Error('Unknown notification type'), {
        type: payload.type,
      })
    }

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        void processNotification(notification)
      }
    )
    return () => {
      Notifications.removeNotificationSubscription(subscription)
    }
  }, [
    fetchMessagesForInbox,
    checkForClubAdmission,
    navigation,
    store,
    syncConnections,
    updateOffersConnections,
    updateClubs,
  ])
}
