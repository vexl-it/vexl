import {Schema} from '@effect/schema'
import * as S from '@effect/schema/Schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {FcmCypherE} from '@vexl-next/domain/src/general/notifications'

export const GetPublicKeyResponse = S.Struct({
  publicKey: PublicKeyPemBase64E,
})

export type GetPublicKeyResponse = S.Schema.Type<typeof GetPublicKeyResponse>

export class IssueNotificationRequest extends S.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  fcmCypher: FcmCypherE,
}) {}

export class IssueNotificationResponse extends S.Class<IssueNotificationResponse>(
  'IssueNotificationResponse'
)({
  success: S.Literal(true),
}) {}

export class InvalidFcmCypherError extends S.TaggedError<InvalidFcmCypherError>()(
  'InvalidFcmCypherError',
  {
    status: Schema.optionalWith(Schema.Literal(400), {
      default: () => 400 as const,
    }),
  }
) {}

export class SendingNotificationError extends S.TaggedError<SendingNotificationError>()(
  'SendingNotificationError',
  {
    tokenInvalid: S.Boolean,
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
