import {Schema} from 'effect/index'
import {NewChatMessageNoticeSendTask} from './services/NotificationSocketMessaging/domain'

// TODO later we can handle more notifications not just chat :)
export const SupportedPushNotificationTask = Schema.Union(
  NewChatMessageNoticeSendTask
)
export type SupportedPushNotificationTask =
  typeof SupportedPushNotificationTask.Type
