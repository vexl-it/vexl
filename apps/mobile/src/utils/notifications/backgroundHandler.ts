import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Option} from 'effect'
import {getDefaultStore} from 'jotai'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import reportError from '../reportError'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    console.info('📳 Background notification received', remoteMessage)
    await showUINotificationFromRemoteMessage(remoteMessage)

    void showDebugNotificationIfEnabled({
      title: `Background notification received`,
      body: `type: ${remoteMessage?.data?.type ?? '[empty]'}`,
    })

    const data = remoteMessage.data
    if (!data) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    const chatMessageNotificationOption =
      ChatNotificationData.parseUnkownOption(remoteMessage.data)
    if (Option.isSome(chatMessageNotificationOption)) {
      await getDefaultStore().set(
        processChatNotificationActionAtom,
        chatMessageNotificationOption.value
      )()
    }
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
