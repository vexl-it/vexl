// Rcps.ts
import {Rpc, RpcGroup} from '@effect/rpc'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {UserInactivityNotificationVariant} from '@vexl-next/domain/src/general/notifications'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export const NotificationConnectionKind = Schema.Literal(
  'foreground',
  'background'
)
export type NotificationConnectionKind = typeof NotificationConnectionKind.Type

const connectionKind = Schema.optionalWith(NotificationConnectionKind, {
  default: () => 'foreground',
})

export const NotificationsStreamClientInfo = Schema.Struct({
  version: VersionCode,
  notificationToken: VexlNotificationTokenSecret,
  platform: PlatformName,
  connectionKind,
})

export type NotificationsStreamClientInfo =
  typeof NotificationsStreamClientInfo.Type

export class NewChatMessageNoticeMessage extends Schema.TaggedClass<NewChatMessageNoticeMessage>(
  'NewChatMessageNoticeMessage'
)('NewChatMessageNoticeMessage', {
  sentAt: UnixMilliseconds,
  targetToken: VexlNotificationToken,
  trackingId: NotificationTrackingId,
}) {}

export class StreamOnlyChatMessage extends Schema.TaggedClass<StreamOnlyChatMessage>(
  'StreamOnlyChatMessage'
)('StreamOnlyChatMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  message: StreamOnlyMessageCypher,
  targetToken: VexlNotificationToken,
}) {}

export class NewUserNoticeMessage extends Schema.TaggedClass<NewUserNoticeMessage>(
  'NewUserNoticeMessage'
)('NewUserNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
}) {}

export class NewClubUserNoticeMessage extends Schema.TaggedClass<NewClubUserNoticeMessage>(
  'NewClubUserNoticeMessage'
)('NewClubUserNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  clubUuid: ClubUuid,
}) {}

export class UserAdmittedToClubNoticeMessage extends Schema.TaggedClass<UserAdmittedToClubNoticeMessage>(
  'UserAdmittedToClubNoticeMessage'
)('UserAdmittedToClubNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  publicKey: PublicKeyPemBase64,
}) {}

export class UserInactivityNoticeMessage extends Schema.TaggedClass<UserInactivityNoticeMessage>(
  'UserInactivityNoticeMessage'
)('UserInactivityNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  // Optional so messages sent by older backends still decode
  variant: Schema.optionalWith(UserInactivityNotificationVariant, {
    default: () => 'FIRST',
  }),
}) {}

export class UserLoginOnDifferentDeviceNoticeMessage extends Schema.TaggedClass<UserLoginOnDifferentDeviceNoticeMessage>(
  'UserLoginOnDifferentDeviceNoticeMessage'
)('UserLoginOnDifferentDeviceNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
}) {}

export class ClubFlaggedNoticeMessage extends Schema.TaggedClass<ClubFlaggedNoticeMessage>(
  'ClubFlaggedNoticeMessage'
)('ClubFlaggedNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  clubUuid: ClubUuid,
}) {}

export class ClubExpiredNoticeMessage extends Schema.TaggedClass<ClubExpiredNoticeMessage>(
  'ClubExpiredNoticeMessage'
)('ClubExpiredNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  clubUuid: ClubUuid,
}) {}

export class NewContentNoticeMessage extends Schema.TaggedClass<NewContentNoticeMessage>(
  'NewContentNoticeMessage'
)('NewContentNoticeMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
}) {}

export class VexlProductNotificationMessage extends Schema.TaggedClass<VexlProductNotificationMessage>(
  'VexlProductNotificationMessage'
)('VexlProductNotificationMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  vexlProductNotification: VexlProductNotification,
}) {}

export class DebugMessage extends Schema.TaggedClass<DebugMessage>(
  'DebugMessage'
)('DebugMessage', {
  text: Schema.optional(Schema.String),
}) {}

export const NotificationStreamMessage = Schema.Union(
  NewChatMessageNoticeMessage,
  NewUserNoticeMessage,
  StreamOnlyChatMessage,
  NewClubUserNoticeMessage,
  UserAdmittedToClubNoticeMessage,
  UserInactivityNoticeMessage,
  UserLoginOnDifferentDeviceNoticeMessage,
  ClubFlaggedNoticeMessage,
  ClubExpiredNoticeMessage,
  NewContentNoticeMessage,
  DebugMessage,
  VexlProductNotificationMessage
)
export type NotificationStreamMessage = typeof NotificationStreamMessage.Type

export class KickedOutDueToAnotherConnectionToTheSameTokenError extends Schema.TaggedError<KickedOutDueToAnotherConnectionToTheSameTokenError>(
  'KickedOutDueToAnotherConnectionToTheSameTokenError'
)('KickedOutDueToAnotherConnectionToTheSameTokenError', {}) {}

export const NotificationStreamError = Schema.Union(
  KickedOutDueToAnotherConnectionToTheSameTokenError,
  UnexpectedServerError
)
export type NotificationStreamError = typeof NotificationStreamError.Type

export class Rpcs extends RpcGroup.make(
  Rpc.make('listenToNotifications', {
    payload: NotificationsStreamClientInfo,
    error: NotificationStreamError,
    success: NotificationStreamMessage,
    stream: true,
  })
) {}
