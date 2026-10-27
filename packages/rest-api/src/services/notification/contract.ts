import {StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'

export class MissingCommonHeadersError extends Schema.TaggedError<MissingCommonHeadersError>(
  'MissingCommonHeadersError'
)('MissingCommonHeadersError', {}) {}

export class IssueNotificationRequest extends Schema.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  notificationToken: VexlNotificationToken,
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
  notificationToken: VexlNotificationToken,
  message: StreamOnlyMessageCypher,
  minimalOtherSideVersion: Schema.optional(VersionCode),
}) {}

export class SendingNotificationError extends Schema.TaggedError<SendingNotificationError>()(
  'SendingNotificationError',
  {
    tokenInvalid: Schema.Boolean,
    status: Schema.optionalWith(Schema.Literal(400), {
      default: () => 400 as const,
    }),
  }
) {}

export class CreateNotificationSecretRequest extends Schema.Class<CreateNotificationSecretRequest>(
  'CreateNotificationSecretRequest'
)({
  expoNotificationToken: Schema.optional(ExpoNotificationToken),
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
  systemVexlToken: Schema.optional(VexlNotificationToken),
  marketingVexlToken: Schema.optional(VexlNotificationToken),
  backgroundSocketEnabled: Schema.optional(Schema.Boolean),
}) {}

export class GenerateNotificationTokenRequest extends Schema.Class<GenerateNotificationTokenRequest>(
  'GenerateNotificationTokenRequest'
)({
  secret: VexlNotificationTokenSecret,
}) {}

export class GenerateNotificationTokenResponse extends Schema.Class<GenerateNotificationTokenResponse>(
  'GenerateNotificationTokenResponse'
)({
  token: VexlNotificationToken,
}) {}

export class InvalidateNotificationTokenRequest extends Schema.Class<InvalidateNotificationTokenRequest>(
  'InvalidateNotificationTokenRequest'
)({
  secret: VexlNotificationTokenSecret,
  tokenToInvalidate: VexlNotificationToken,
}) {}

export class InvalidateNotificationSecretRequest extends Schema.Class<InvalidateNotificationSecretRequest>(
  'InvalidateNotificationSecretRequest'
)({
  secretToInvalidate: VexlNotificationTokenSecret,
}) {}
