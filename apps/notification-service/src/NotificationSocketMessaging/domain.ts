import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypherE} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'

import {
  createNotificationTrackingId,
  NotificationTrackingId,
} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {
  ExpoNotificationTokenE,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  UnixMillisecondsE,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {
  NewChatMessageNoticeMessage,
  StreamOnlyChatMessage,
  type NotificationsStreamClientInfo,
  type NotificationStreamError,
  type NotificationStreamMessage,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Option, pipe, Schema, String, type Effect} from 'effect/index'

const EXPO_PREFIX = 'expo-'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificaitionToken'),
  Schema.filter(String.startsWith(EXPO_PREFIX))
)
export type VexlNotificationToken = typeof VexlNotificationToken.Type

export const ClientInfo = Schema.Struct({
  notificationToken: VexlNotificationToken,
  version: VersionCode,
  platform: PlatformName,
})
export type ClientInfo = typeof ClientInfo.Type

export const StreamConnectionId = Schema.String.pipe(
  Schema.brand('StreamConnectionId')
)
export type StreamConnectionId = typeof StreamConnectionId.Type
export const newStreamConnectionId = (): StreamConnectionId =>
  Schema.decodeSync(StreamConnectionId)(generateUuid())

export const vexlNotificationTokenToExpoToken = (
  vexlNotificationToken: VexlNotificationToken
): Option.Option<ExpoNotificationToken> => {
  return pipe(
    Option.some(vexlNotificationToken),
    Option.filter(String.startsWith(EXPO_PREFIX)),
    Option.map(String.replace(EXPO_PREFIX, '')),
    Option.flatMap(Schema.decodeOption(ExpoNotificationTokenE))
  )
}

export const vexlNotificationTokenFromExpoToken = (
  expoNotificationToken: ExpoNotificationToken
): VexlNotificationToken => {
  return pipe(
    String.concat(EXPO_PREFIX, expoNotificationToken),
    Schema.decodeSync(VexlNotificationToken)
  )
}

export const ConnectionManagerChannelId = Schema.String.pipe(
  Schema.brand('ConnectionManagerChannelId')
)
export type ConnectionManagerChannelId = typeof ConnectionManagerChannelId.Type

export const ConnectionRedisRecord = Schema.Struct({
  connectionId: StreamConnectionId,
  clientInfo: ClientInfo,
  managerId: ConnectionManagerChannelId,
})
export type ConnectionRedisRecord = typeof ConnectionRedisRecord.Type

export interface ConnectionToClient {
  connectionInfo: NotificationsStreamClientInfo
  send: (message: NotificationStreamMessage) => Effect.Effect<boolean>
  kickOut: (error?: NotificationStreamError) => Effect.Effect<void>
}

const SendMessageTaskId = Schema.String.pipe(Schema.brand('SendMessageTaskId'))
const newSendMessageTaskId = (): SendMessageTaskId =>
  Schema.decodeSync(SendMessageTaskId)(generateUuid())
export type SendMessageTaskId = typeof SendMessageTaskId.Type

/**
 * Representing a task to send a new chat message notice notification.
 */
export class NewChatMessageNoticeSendTask extends Schema.TaggedClass<NewChatMessageNoticeSendTask>(
  'NewChatMessageNoticeSendTask'
)('NewChatMessageNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationToken,
  targetCypher: NotificationCypherE,
  sendNewChatMessageNotification: Schema.Boolean,
  sentAt: Schema.optionalWith(UnixMillisecondsE, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): NewChatMessageNoticeMessage {
    return new NewChatMessageNoticeMessage({
      sentAt: this.sentAt,
      targetCypher: this.targetCypher,
      trackingId: this.trackingId,
    })
  }
}

/**
 * Representing a task to send a message that should only be sent over the stream connection (if any)
 */
export class StreamOnlyChatMessageSendTask extends Schema.TaggedClass<StreamOnlyChatMessageSendTask>(
  'StreamOnlyChatMessageSendTask'
)('StreamOnlyChatMessageSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationToken,
  targetCypher: NotificationCypherE,
  message: StreamOnlyMessageCypher,
  sentAt: Schema.optionalWith(UnixMillisecondsE, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): StreamOnlyChatMessage {
    return new StreamOnlyChatMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
      message: this.message,
      targetCypher: this.targetCypher,
    })
  }
}

export const SendMessageTask = Schema.Union(
  NewChatMessageNoticeSendTask,
  StreamOnlyChatMessageSendTask
)
export type SendMessageTask = typeof SendMessageTask.Type
