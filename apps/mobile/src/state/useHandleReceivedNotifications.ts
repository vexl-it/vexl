import messaging from '@react-native-firebase/messaging'
import {useNavigation} from '@react-navigation/native'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Option} from 'effect'
import {useSetAtom, useStore} from 'jotai'
import {useEffect} from 'react'
import {NEW_CONNECTION} from '../utils/notifications/notificationTypes'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from '../utils/notifications/showUINotificationFromRemoteMessage'
import reportError from '../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from './chat/atoms/fetchNewMessagesActionAtom'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from './notifications/processChatNotification'

export function useHandleReceivedNotifications(): void {
  const navigation = useNavigation()
  const store = useStore()
  const fetchMessagesForInbox = useSetAtom(fetchAndStoreMessagesForInboxAtom)
  const updateOffersConnections = useSetAtom(
    updateAllOffersConnectionsActionAtom
  )

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      console.info('📳 Received notification', remoteMessage)
      await showDebugNotificationIfEnabled({
        title: 'Received notification in foreground',
        body: JSON.stringify(remoteMessage.data),
      })

      const newChatMessageNoticeNotificationDataOption =
        NewChatMessageNoticeNotificationData.parseUnkownOption(
          remoteMessage.data
        )
      if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
        await store.set(
          processChatNotificationActionAtom,
          newChatMessageNoticeNotificationDataOption.value
        )()
        return
      }

      const data = remoteMessage.data
      if (!data) {
        console.info(
          '📳 Nothing to process. Notification does not include any data'
        )
        return
      }

      const handled = await showUINotificationFromRemoteMessage(data)
      if (handled) return

      if (data.type === NEW_CONNECTION) {
        console.info(
          '📳 Received notification about new user. Checking and updating offers accordingly.'
        )
        await updateOffersConnections({isInBackground: false})()
        return
      }

      reportError('warn', new Error('Unknown notification type'), {
        type: data.type,
      })
    })
  }, [fetchMessagesForInbox, navigation, store, updateOffersConnections])
}
