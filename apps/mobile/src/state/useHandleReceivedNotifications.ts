import {useNavigation} from '@react-navigation/native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Option} from 'effect'
import * as Notifications from 'expo-notifications'
import {useSetAtom, useStore} from 'jotai'
import {useEffect} from 'react'
import {AppState, Platform} from 'react-native'
import {extractDataPayloadFromNotification} from '../utils/notifications/extractDataFromNotification'
import {NEW_CONNECTION} from '../utils/notifications/notificationTypes'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from '../utils/notifications/showUINotificationFromRemoteMessage'
import reportError from '../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from './chat/atoms/fetchNewMessagesActionAtom'
import {syncConnectionsActionAtom} from './connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from './notifications/processChatNotification'

export function useHandleReceivedNotifications(): void {
  const navigation = useNavigation()
  const store = useStore()
  const fetchMessagesForInbox = useSetAtom(fetchAndStoreMessagesForInboxAtom)
  const updateOffersConnections = useSetAtom(
    updateAllOffersConnectionsActionAtom
  )
  const syncConnections = useSetAtom(syncConnectionsActionAtom)
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
        await store.set(
          processChatNotificationActionAtom,
          newChatMessageNoticeNotificationDataOption.value
        )()
        return
      }

      const handled = await showUINotificationFromRemoteMessage(payload)
      if (handled) return
      if (payload.type === NEW_CONNECTION) {
        console.info(
          '🔔 Received notification about new user. Checking and updating offers accordingly.'
        )
        await syncConnections()()
        await updateOffersConnections({isInBackground: false})()
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
    navigation,
    store,
    syncConnections,
    updateOffersConnections,
  ])
}
