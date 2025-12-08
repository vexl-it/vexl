import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypherE} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export const GetPublicKeyResponse = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})

export type GetPublicKeyResponse = typeof GetPublicKeyResponse.Type

export class IssueNotificationRequest extends Schema.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  notificationCypher: NotificationCypherE,
  /**
   * Wether to send a system notification indicating there is a new chat notification.
   */
  sendNewChatMessageNotification: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
}) {}

export class ReportNotificationProcessedRequest extends Schema.Class<ReportNotificationProcessedRequest>(
  'ReportNotificationProcessedRequest'
)({
  trackingId: NotificationTrackingId,
}) {}

export class IssueNotificationResponse extends Schema.Class<IssueNotificationResponse>(
  'IssueNotificationResponse'
)({
  success: Schema.Literal(true),
}) {}

export class IssueStreamOnlyMessageRequest extends Schema.Class<IssueStreamOnlyMessageRequest>(
  'IssueStreamOnlyMessageRequest'
)({
  notificationCypher: NotificationCypherE,
  message: StreamOnlyMessageCypher,
  minimalOtherSideVersion: Schema.optional(VersionCode),
}) {}

export class InvalidFcmCypherError extends Schema.TaggedError<InvalidFcmCypherError>()(
  'InvalidFcmCypherError',
  {
    status: Schema.optionalWith(Schema.Literal(400), {
      default: () => 400 as const,
    }),
  }
) {}

export class InvalidNotificationCypherError extends Schema.TaggedError<InvalidNotificationCypherError>()(
  'InvalidNotificationCypherError',
  {
    status: Schema.optionalWith(Schema.Literal(400), {
      default: () => 400 as const,
    }),
  }
) {}

export class SendingNotificationError extends Schema.TaggedError<SendingNotificationError>()(
  'SendingNotificationError',
  {
    tokenInvalid: Schema.Boolean,
    status: Schema.optionalWith(Schema.Literal(400), {
      default: () => 400 as const,
    }),
  }
) {}
