import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Option} from 'effect'
import {getDefaultStore} from 'jotai'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import reportError from '../reportError'
import {NEW_CONNECTION} from './notificationTypes'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    void showDebugNotificationIfEnabled({
      title: `Background notification received`,
      body: `type: ${typeof remoteMessage?.data?.type === 'string' ? remoteMessage.data.type : typeof remoteMessage?.data?.type === 'object' ? JSON.stringify(remoteMessage.data.tyoe) : '[empty]'}`,
    })
    console.info('📳 Background notification received', remoteMessage)

    const newChatMessageNoticeNotificationDataOption =
      NewChatMessageNoticeNotificationData.parseUnkownOption(remoteMessage.data)
    if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
      await getDefaultStore().set(
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

    if (data.type === NEW_CONNECTION) {
      await getDefaultStore().set(syncConnectionsActionAtom)()
      await getDefaultStore().set(updateAllOffersConnectionsActionAtom, {
        isInBackground: true,
      })()
      return
    }

    await showUINotificationFromRemoteMessage(data)
  } catch (error) {
    void showDebugNotificationIfEnabled({
      title: 'Error while processing notification on background',
      body: (error as Error).message ?? 'no message',
    })
    reportError(
      'error',
      new Error('Error while processing background notification'),
      {
        error,
      }
    )
  }
}

function setupBackgroundMessaging(): void {
  try {
    messaging().setBackgroundMessageHandler(processBackgroundMessage)
    console.log('📳 Registered background message handler')
  } catch (error) {
    reportError(
      'error',
      new Error('Error while registering background message handler'),
      {
        error,
      }
    )
  }
}

setupBackgroundMessaging()
