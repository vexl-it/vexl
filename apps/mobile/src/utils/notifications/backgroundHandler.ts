import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import reportError from '../reportError'
import {showUINotificationFromRemoteMessage} from './index'
import {getDefaultStore} from 'jotai'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {NEW_CONNECTION} from './notificationTypes'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    console.info('📳 Background notification received', remoteMessage)

    if (!remoteMessage.notification) {
      console.info(
        '📳 Notification does not include payload, for system to display UI notification. Calling `showUINotification` function.'
      )
      await showUINotificationFromRemoteMessage(remoteMessage)
    }

    if (remoteMessage.data?.type === NEW_CONNECTION) {
      console.info(
        '📳 Received notification about new user. Checking and updating offers accordingly.'
      )
      await getDefaultStore().set(updateAllOffersConnectionsActionAtom, {
        isInBackground: true,
      })()
    }
  } catch (error) {
    reportError(
      'error',
      'Error while processing background notification',
      error
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
      'Error while registering background message handler',
      error
    )
  }
}

setupBackgroundMessaging()
