import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  VexlNotificationTokenNotTemporary,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export class MissingCommonHeadersError extends Schema.TaggedError<MissingCommonHeadersError>(
  'MissingCommonHeadersError'
)('MissingCommonHeadersError', {}) {}

export const GetPublicKeyResponse = Schema.Struct({
  publicKey: PublicKeyPemBase64,
})

export type GetPublicKeyResponse = typeof GetPublicKeyResponse.Type

export class IssueNotificationRequest extends Schema.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  // todo: #2124 remove this
  notificationCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // todo: #2124 remove nullOr and temporary tokens
  notificationToken: Schema.optional(VexlNotificationTokenNotTemporary),
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
  // todo: #2124 remove this
  notificationCypher: Schema.optional(
    Schema.Union(NotificationCypher, VexlNotificationTokenNotTemporary)
  ),
  // todo: #2124 remove nullOr and temporary tokens
  notificationToken: Schema.optional(VexlNotificationTokenNotTemporary),
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

export class InvalidNotificationCypherrror extends Schema.TaggedError<InvalidNotificationCypherrror>()(
  'InvalidNotificationCypherrror',
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

// TODO
// Create notification secret
// Update notification info
// Generate notification token
// Invalidate notification token

// QASCOM

export class CreateNotificationSecretRequest extends Schema.Class<CreateNotificationSecretRequest>(
  'CreateNotificationSecretRequest'
)({
  expoNotificationToken: ExpoNotificationToken,
}) {}

export class CreateNotificationSecretResponse extends Schema.Class<CreateNotificationSecretResponse>(
  'CreateNotificationSecretResponse'
)({
  secret: VexlNotificationTokenSecret,
}) {}

export class UpdateNotificationInfoRequest extends Schema.Class<UpdateNotificationInfoRequest>(
  'UpdateNotificationInfoRequest'
)({
  secret: VexlNotificationTokenSecret,
  expoNotificationToken: Schema.optional(ExpoNotificationToken),
}) {}

export class GenerateNotificationTokenRequest extends Schema.Class<GenerateNotificationTokenRequest>(
  'GenerateNotificationTokenRequest'
)({
  secret: VexlNotificationTokenSecret,
}) {}

export class GenerateNotificationTokenResponse extends Schema.Class<GenerateNotificationTokenResponse>(
  'GenerateNotificationTokenResponse'
)({
  token: VexlNotificationTokenNotTemporary,
}) {}

export class InvalidateNotificationTokenRequest extends Schema.Class<InvalidateNotificationTokenRequest>(
  'InvalidateNotificationTokenRequest'
)({
  secret: VexlNotificationTokenSecret,
  tokenToInvalidate: VexlNotificationTokenNotTemporary,
}) {}

export class InvalidateNotificationSecretRequest extends Schema.Class<InvalidateNotificationSecretRequest>(
  'InvalidateNotificationSecretRequest'
)({
  secretToInvalidate: VexlNotificationTokenSecret,
}) {}
