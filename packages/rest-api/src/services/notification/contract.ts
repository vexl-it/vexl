import * as S from '@effect/schema/Schema'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {FcmCypherE} from '@vexl-next/domain/src/general/notifications'
import {z} from 'zod'

export const GetPublicKeyResponse = z.object({
  publicKey: PublicKeyPemBase64,
})

export const GetPublicKeyResponseE = S.Struct({
  publicKey: PublicKeyPemBase64E,
})

export type GetPublicKeyResponse = S.Schema.Type<typeof GetPublicKeyResponseE>

export class IssueNotificationRequest extends S.Class<IssueNotificationRequest>(
  'IssueNotificationRequest'
)({
  fcmCypher: FcmCypherE,
  messagePayload: S.String,
}) {}

export class IssueNotificationResponse extends S.Class<IssueNotificationResponse>(
  'IssueNotificationResponse'
)({
  success: S.Literal(true),
}) {}

export class InvalidFcmCypherError extends S.TaggedError<InvalidFcmCypherError>()(
  'InvalidFcmCypherError',
  {}
) {}

export class SendingNotificationError extends S.TaggedError<InvalidFcmCypherError>()(
  'SendingNotificationError',
  {
    tokenInvalid: S.Boolean,
  }
) {}
