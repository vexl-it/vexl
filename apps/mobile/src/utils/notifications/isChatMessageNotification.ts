import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {ChatNotificationData} from './ChatNotificationData'

export default function isChatMessageNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): boolean {
  return ChatNotificationData.safeParse(remoteMessage.data).success
}
