import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import reportError from '../reportError'
import {showUINotification} from './index'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  console.info('📳 Background notification received', remoteMessage)

  if (!remoteMessage.notification) {
    console.info(
      '📳 Notification does not include payload, for system to display UI notification. Calling `showUINotification` function.'
    )
    await showUINotification(remoteMessage)
  }
}

export function setupBackgroundMessaging(): void {
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
