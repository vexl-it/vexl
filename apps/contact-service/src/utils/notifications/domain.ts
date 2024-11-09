import {Schema} from 'effect'

const FirebaseErrorCode = Schema.Union(
  Schema.String,
  Schema.Literal(
    `messaging/internal`,
    'messaging/invalid_argument',
    'messaging/quota_exceeded',
    'messaging/sender_id_mismatch',
    'messaging/third_party_auth_error',
    'messaging/unavailable',
    'messaging/unregistered',
    'unknown'
  )
)
export type FirebaseErrorCode = Schema.Schema.Type<typeof FirebaseErrorCode>

export class IssuingNotificationFirebaseError extends Schema.TaggedError<IssuingNotificationFirebaseError>(
  'IssuingNotificationFirebaseError'
)('IssuingNotificationFirebaseError', {
  cause: Schema.optional(Schema.Unknown),
  firebaseErrorCode: Schema.optional(FirebaseErrorCode),
  isCausedByInvalidToken: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  message: Schema.String,
}) {}

export class IssuingNotificationUnexpectedError extends Schema.TaggedError<IssuingNotificationUnexpectedError>(
  'IssuingNotificationUnexpectedError'
)('IssuingNotificationUnexpectedError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}
