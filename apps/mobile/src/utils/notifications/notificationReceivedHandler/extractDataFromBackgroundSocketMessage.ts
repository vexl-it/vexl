import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
  UserInactivityNotificationData,
  UserLoginOnDifferentDeviceNotificationData,
  VexlProductNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {NotificationStreamMessage} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Effect, Option, Schema} from 'effect'
import {
  type AcceptedNotificationTypes,
  ErrorParsingNotification,
} from './domain'

const toNotificationData = (
  message: typeof NotificationStreamMessage.Type
): Option.Option<AcceptedNotificationTypes> => {
  switch (message._tag) {
    case 'NewChatMessageNoticeMessage':
      return Option.some(
        new NewChatMessageNoticeNotificationData({
          targetToken: message.targetToken,
          trackingId: Option.some(message.trackingId),
          sentAt: message.sentAt,
          includesSystemNotification: false,
          systemNotificationSent: Option.some(false),
        })
      )
    case 'NewUserNoticeMessage':
      return Option.some(
        new NewSocialNetworkConnectionNotificationData({
          type: 'NEW_APP_USER',
          trackingId: Option.some(message.trackingId),
          sentAt: message.sentAt,
        })
      )
    case 'NewClubUserNoticeMessage':
      return Option.some(
        new NewClubConnectionNotificationData({
          clubUuids: [message.clubUuid],
          trackingId: Option.some(message.trackingId),
        })
      )
    case 'UserAdmittedToClubNoticeMessage':
      return Option.some(
        new AdmitedToClubNetworkNotificationData({
          publicKey: message.publicKey,
          trackingId: Option.some(message.trackingId),
        })
      )
    case 'UserInactivityNoticeMessage':
      return Option.some(
        new UserInactivityNotificationData({
          trackingId: Option.some(message.trackingId),
          variant: message.variant,
        })
      )
    case 'UserLoginOnDifferentDeviceNoticeMessage':
      return Option.some(
        new UserLoginOnDifferentDeviceNotificationData({
          trackingId: Option.some(message.trackingId),
        })
      )
    case 'ClubFlaggedNoticeMessage':
    case 'ClubExpiredNoticeMessage':
      return Option.some(
        new ClubDeactivatedNotificationData({
          clubUuid: message.clubUuid,
          reason:
            message._tag === 'ClubFlaggedNoticeMessage' ? 'FLAGGED' : 'EXPIRED',
          trackingId: Option.some(message.trackingId),
        })
      )
    case 'VexlProductNotificationMessage':
      return Option.some(
        new VexlProductNotificationData({
          ...message.vexlProductNotification,
          trackingId: Option.some(message.trackingId),
        })
      )
    case 'DebugMessage':
    case 'StreamOnlyChatMessage':
    case 'NewContentNoticeMessage':
      return Option.none()
  }
}

export const extractDataFromBackgroundSocketMessage = (
  message: string
): Effect.Effect<
  Option.Option<AcceptedNotificationTypes>,
  ErrorParsingNotification
> =>
  Effect.try({
    try: () => JSON.parse(message),
    catch: () =>
      new ErrorParsingNotification({
        message: 'Error parsing background socket notification JSON',
      }),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(NotificationStreamMessage)),
    Effect.map(toNotificationData),
    Effect.catchTag(
      'ParseError',
      () =>
        new ErrorParsingNotification({
          message: 'Error decoding background socket notification',
        })
    )
  )
