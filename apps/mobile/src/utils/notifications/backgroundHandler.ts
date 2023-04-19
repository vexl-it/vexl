import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import reportError from '../reportError'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  console.log('Background notification received', JSON.stringify(remoteMessage))
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
