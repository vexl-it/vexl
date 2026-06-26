import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  DebugDummyNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
  UserInactivityNotificationData,
  UserLoginOnDifferentDeviceNotificationData,
  VexlProductNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Schema} from 'effect/index'

export class ErrorParsingNotification extends Schema.TaggedError<ErrorParsingNotification>(
  'ErrorParsingNotification'
)('ErrorParsingNotification', {
  message: Schema.String,
  cause: Schema.Unknown,
  data: Schema.Unknown,
}) {}

export class ErrorLoadingSession extends Schema.TaggedError<ErrorLoadingSession>(
  'ErrorLoadingSession'
)('ErrorLoadingSession', {}) {}

export const RawNotificationData = Schema.Struct({
  data: Schema.Record({
    key: Schema.String,
    value: Schema.Unknown,
  }),
})
export type RawNotificationData = typeof RawNotificationData.Type

export const AcceptedNotificationTypes = Schema.Union(
  NewChatMessageNoticeNotificationData,
  NewSocialNetworkConnectionNotificationData,
  NewClubConnectionNotificationData,
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  UserLoginOnDifferentDeviceNotificationData,
  UserInactivityNotificationData,
  VexlProductNotificationData,
  DebugDummyNotificationData
)
export type AcceptedNotificationTypes = typeof AcceptedNotificationTypes.Type
