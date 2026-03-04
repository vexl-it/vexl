import {ChatNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type Notification} from 'expo-notifications'

export default function isChatMessageNotification(
  remoteMessage: Notification['request']['content']['data']
): boolean {
  if (!remoteMessage) return false
  return (
    ChatNotificationData.parseUnkownOption(remoteMessage.data)._tag === 'Some'
  )
}
