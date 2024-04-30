import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'

export default function isChatMessageNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): boolean {
  return (
    ChatNotificationData.parseUnkownOption(remoteMessage.data)._tag === 'Some'
  )
}
