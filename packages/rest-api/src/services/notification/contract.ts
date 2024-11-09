import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {FcmCypherE} from '@vexl-next/domain/src/general/notifications'
import {Schema} from 'effect'

export const GetPublicKeyResponse = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
})

export type GetPublicKeyResponse = Schema.Schema.Type<
  typeof GetPublicKeyResponse
>

export class IssueNotificationRequest extends Schema.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  fcmCypher: FcmCypherE,
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
  SendingNotificationError
)

export const IssueNotificationInput = Schema.Struct({
  body: IssueNotificationRequest,
})
export type IssueNotificationInput = Schema.Schema.Type<
  typeof IssueNotificationInput
>
