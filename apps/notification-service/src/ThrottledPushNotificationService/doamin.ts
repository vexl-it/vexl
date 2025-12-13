import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Schema} from 'effect/index'
import {NewChatMessageNoticeSendTask} from '../NotificationSocketMessaging/domain'

// TODO later we can handle more notifications not just chat :)
export class ThrottlePushNotificationServiceTask extends Schema.Class<ThrottlePushNotificationServiceTask>(
  'ThrottlePushNotificationServiceTask'
)({
  token: ExpoNotificationTokenE,
  task: Schema.Union(NewChatMessageNoticeSendTask),
}) {}
