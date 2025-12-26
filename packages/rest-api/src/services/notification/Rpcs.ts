// Rcps.ts
import {Rpc, RpcGroup} from '@effect/rpc'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export const NotificationsStreamClientInfo = Schema.Struct({
  version: VersionCode,
  notificationToken: ExpoNotificationToken, // TODO create endpoint for validation
  platform: PlatformName,
})
export type NotificationsStreamClientInfo =
  typeof NotificationsStreamClientInfo.Type

export class NewChatMessageNoticeMessage extends Schema.TaggedClass<NewChatMessageNoticeMessage>(
  'NewChatMessageNoticeMessage'
)('NewChatMessageNoticeMessage', {
  sentAt: UnixMilliseconds,
  targetCypher: NotificationCypher,
  trackingId: NotificationTrackingId,
}) {}

export class StreamOnlyChatMessage extends Schema.TaggedClass<StreamOnlyChatMessage>(
  'StreamOnlyChatMessage'
)('StreamOnlyChatMessage', {
  sentAt: UnixMilliseconds,
  trackingId: NotificationTrackingId,
  message: StreamOnlyMessageCypher,
  targetCypher: NotificationCypher,
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
    payload: NotificationsStreamClientInfo,
    error: NotificationStreamError,
    success: NotificationStreamMessage,
    stream: true,
  })
) {}
