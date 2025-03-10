import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {FcmCypherE} from '@vexl-next/domain/src/general/notifications/index'
import {NotificationCypherE} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {Schema} from 'effect'

export const GetPublicKeyResponse = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})

export type GetPublicKeyResponse = typeof GetPublicKeyResponse.Type

export class IssueNotificationRequest extends Schema.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  // Once we depreciate old version remove fcm cypher and make notification cypher mandatory!
  fcmCypher: Schema.optional(FcmCypherE),
  notificationCypher: Schema.optional(NotificationCypherE),
}) {}

export class IssueNotificationResponse extends Schema.Class<IssueNotificationResponse>(
  'IssueNotificationResponse'
)({
  success: Schema.Literal(true),
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

export const IssueNotificationErrors = Schema.Union(
  InvalidFcmCypherError,
  SendingNotificationError,
  InvalidNotificationCypherError
)

export const IssueNotificationInput = Schema.Struct({
  body: IssueNotificationRequest,
})
export type IssueNotificationInput = typeof IssueNotificationInput.Type
