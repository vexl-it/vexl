import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'

import {
  createNotificationTrackingId,
  NotificationTrackingId,
} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {
  ClubExpiredNoticeMessage,
  ClubFlaggedNoticeMessage,
  NewChatMessageNoticeMessage,
  NewClubUserNoticeMessage,
  NewContentNoticeMessage,
  NewUserNoticeMessage,
  StreamOnlyChatMessage,
  UserAdmittedToClubNoticeMessage,
  UserInactivityNoticeMessage,
  UserLoginOnDifferentDeviceNoticeMessage,
  type NotificationsStreamClientInfo,
  type NotificationStreamError,
  type NotificationStreamMessage,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Option, pipe, Schema, String, type Effect} from 'effect/index'

const EXPO_PREFIX = 'expo-'

export const ClientInfo = Schema.Struct({
  notificationToken: VexlNotificationTokenSecret,
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
    Option.flatMap(Schema.decodeOption(ExpoNotificationToken))
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
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - remove this since notification cypher is not used anymore
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.optional(VexlNotificationToken),
  sendNewChatMessageNotification: Schema.Boolean,
  sentAt: Schema.optionalWith(UnixMilliseconds, {
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
      targetToken: this.targetToken,
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
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.optional(VexlNotificationToken),
  message: StreamOnlyMessageCypher,
  sentAt: Schema.optionalWith(UnixMilliseconds, {
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
      targetToken: this.targetToken,
    })
  }
}

/**
 * Representing a task to send a new user notice notification.
 */
export class NewUserNoticeSendTask extends Schema.TaggedClass<NewUserNoticeSendTask>(
  'NewUserNoticeSendTask'
)('NewUserNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): NewUserNoticeMessage {
    return new NewUserNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
    })
  }
}

export class NewClubUserNoticeSendTask extends Schema.TaggedClass<NewClubUserNoticeSendTask>(
  'NewClubUserNoticeSendTask'
)('NewClubUserNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
  clubUuid: ClubUuid,
}) {
  get socketMessage(): NewClubUserNoticeMessage {
    return new NewClubUserNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
      clubUuid: this.clubUuid,
    })
  }
}

export class UserAdmittedToClubNoticeSendTask extends Schema.TaggedClass<UserAdmittedToClubNoticeSendTask>(
  'UserAdmittedToClubNoticeSendTask'
)('UserAdmittedToClubNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
  publicKey: PublicKeyPemBase64,
}) {
  get socketMessage(): UserAdmittedToClubNoticeMessage {
    return new UserAdmittedToClubNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
      publicKey: this.publicKey,
    })
  }
}

export class UserInactivityNoticeSendTask extends Schema.TaggedClass<UserInactivityNoticeSendTask>(
  'UserInactivityNoticeSendTask'
)('UserInactivityNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): UserInactivityNoticeMessage {
    return new UserInactivityNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
    })
  }
}

export class UserLoginOnDifferentDeviceNoticeSendTask extends Schema.TaggedClass<UserLoginOnDifferentDeviceNoticeSendTask>(
  'UserLoginOnDifferentDeviceNoticeSendTask'
)('UserLoginOnDifferentDeviceNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): UserLoginOnDifferentDeviceNoticeMessage {
    return new UserLoginOnDifferentDeviceNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
    })
  }
}

export class ClubFlaggedNoticeSendTask extends Schema.TaggedClass<ClubFlaggedNoticeSendTask>(
  'ClubFlaggedNoticeSendTask'
)('ClubFlaggedNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
  clubUuid: ClubUuid,
}) {
  get socketMessage(): ClubFlaggedNoticeMessage {
    return new ClubFlaggedNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
      clubUuid: this.clubUuid,
    })
  }
}

export class ClubExpiredNoticeSendTask extends Schema.TaggedClass<ClubExpiredNoticeSendTask>(
  'ClubExpiredNoticeSendTask'
)('ClubExpiredNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
  clubUuid: ClubUuid,
}) {
  get socketMessage(): ClubExpiredNoticeMessage {
    return new ClubExpiredNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
      clubUuid: this.clubUuid,
    })
  }
}

export class NewContentNoticeSendTask extends Schema.TaggedClass<NewContentNoticeSendTask>(
  'NewContentNoticeSendTask'
)('NewContentNoticeSendTask', {
  id: Schema.optionalWith(SendMessageTaskId, {
    default: () => newSendMessageTaskId(),
  }),
  notificationToken: VexlNotificationTokenSecret,
  // todo #2124 - Remove
  targetCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationToken)
  ),
  // todo #2124 - Remove nullOr
  targetToken: Schema.NullOr(VexlNotificationToken),
  sentAt: Schema.optionalWith(UnixMilliseconds, {
    default: () => unixMillisecondsNow(),
  }),
  trackingId: Schema.optionalWith(NotificationTrackingId, {
    default: () => createNotificationTrackingId(),
  }),
  minimalClientVersion: Schema.optional(VersionCode),
}) {
  get socketMessage(): NewContentNoticeMessage {
    return new NewContentNoticeMessage({
      sentAt: this.sentAt,
      trackingId: this.trackingId,
    })
  }
}

export const SendMessageTask = Schema.Union(
  NewChatMessageNoticeSendTask,
  NewUserNoticeSendTask,
  StreamOnlyChatMessageSendTask,
  NewClubUserNoticeSendTask,
  UserAdmittedToClubNoticeSendTask,
  UserInactivityNoticeSendTask,
  UserLoginOnDifferentDeviceNoticeSendTask,
  ClubFlaggedNoticeSendTask,
  ClubExpiredNoticeSendTask,
  NewContentNoticeSendTask
)
export type SendMessageTask = typeof SendMessageTask.Type
