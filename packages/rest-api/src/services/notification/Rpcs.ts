// Rcps.ts
import {Rpc, RpcGroup} from '@effect/rpc'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export const NotificationsStreamClientInfo = Schema.Struct({
  version: VersionCode,
  notificationToken: VexlNotificationTokenSecret,
  platform: PlatformName,
})

// todo #2124
export const NotificationsStreamClientInfoOld = Schema.Struct({
  version: VersionCode,
  notificationToken: Schema.Union(
    ExpoNotificationToken,
    VexlNotificationTokenSecret
  ),
  platform: PlatformName,
})
export type NotificationsStreamClientInfo =
  typeof NotificationsStreamClientInfo.Type

export class NewChatMessageNoticeMessage extends Schema.TaggedClass<NewChatMessageNoticeMessage>(
  'NewChatMessageNoticeMessage'
)('NewChatMessageNoticeMessage', {
  sentAt: UnixMilliseconds,
  // TODO remove #2124
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // TODO remove optional #2124
  targetToken: Schema.optional(VexlNotificationToken),
  trackingId: NotificationTrackingId,
}) {}

export class StreamOnlyChatMessage extends Schema.TaggedClass<StreamOnlyChatMessage>(
  'StreamOnlyChatMessage'
)('StreamOnlyChatMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  message: StreamOnlyMessageCypher,
  // TODO remove #2124
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // TODO remove nullOr #2124
  targetToken: Schema.optional(VexlNotificationToken),
}) {}

export class DebugMessage extends Schema.TaggedClass<DebugMessage>(
  'DebugMessage'
)('DebugMessage', {
  text: Schema.optional(Schema.String),
}) {}

export const NotificationStreamMessage = Schema.Union(
  NewChatMessageNoticeMessage,
  StreamOnlyChatMessage,
  DebugMessage
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
    payload: NotificationsStreamClientInfoOld,
    error: NotificationStreamError,
    success: NotificationStreamMessage,
    stream: true,
  })
) {}
