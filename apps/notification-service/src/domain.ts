import {Schema} from 'effect/index'
import {
  ClubExpiredNoticeSendTask,
  ClubFlaggedNoticeSendTask,
  NewChatMessageNoticeSendTask,
  NewClubUserNoticeSendTask,
  NewContentNoticeSendTask,
  NewUserNoticeSendTask,
  UserAdmittedToClubNoticeSendTask,
  UserInactivityNoticeSendTask,
  UserLoginOnDifferentDeviceNoticeSendTask,
} from './services/NotificationSocketMessaging/domain'

// TODO later we can handle more notifications not just chat :)
export const SupportedPushNotificationTask = Schema.Union(
  NewChatMessageNoticeSendTask,
  NewUserNoticeSendTask,
  NewClubUserNoticeSendTask,
  UserAdmittedToClubNoticeSendTask,
  UserInactivityNoticeSendTask,
  UserLoginOnDifferentDeviceNoticeSendTask,
  ClubFlaggedNoticeSendTask,
  ClubExpiredNoticeSendTask,
  NewContentNoticeSendTask
)
export type SupportedPushNotificationTask =
  typeof SupportedPushNotificationTask.Type
