import {Schema} from '@effect/schema'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ConnectionLevel,
  ConnectionLevelE,
} from '@vexl-next/domain/src/general/offers'
import {FcmToken, FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {BooleanfromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {z} from 'zod'
import {
  PageRequest,
  PageRequestE,
  PageResponse,
  PageResponseE,
} from '../../Pagination.brand'

export class InboxDoesNotExistError extends Schema.TaggedError<ImportListEmptyError>(
  'inboxDoesNotExist'
)('inboxDoesNotExist', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal(100101), {default: () => 100101}),
}) {}

export class NotPermittedToSendMessageToTargetInboxError extends Schema.TaggedError<NotPermittedToSendMessageToTargetInboxError>(
  'notPermittedToSendMessageToTargetInbox'
)('notPermittedToSendMessageToTargetInbox', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal(100104), {default: () => 100104}),
}) {}

export class ImportListEmptyError extends Schema.TaggedError<ImportListEmptyError>(
  'ImportListEmptyError'
)('ImportListEmpty', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal(101102), {default: () => 101102}),
}) {}

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>(
  'UserNotFoundError'
)('UserNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal(100101), {default: () => 100101}),
}) {}

export const CreateUserRequest = z
  .object({
    firebaseToken: FcmToken.optional(),
  })
  .readonly()

export const CreateUserRequestE = Schema.Struct({
  firebaseToken: Schema.NullOr(FcmTokenE),
})

export type CreateUserRequest = Schema.Schema.Type<typeof CreateUserRequestE>

export const RefreshUserRequest = z
  .object({
    offersAlive: z.boolean(),
  })
  .readonly()
export const RefreshUserRequestE = Schema.Struct({
  offersAlive: Schema.Boolean,
})
export type RefreshUserRequest = Schema.Schema.Type<typeof RefreshUserRequestE>

export const UpdateFirebaseTokenRequest = z
  .object({
    firebaseToken: z.string().nullable(),
  })
  .readonly()
export const UpdateFirebaseTokenRequestE = Schema.Struct({
  firebaseToken: Schema.NullOr(FcmTokenE),
})
export type UpdateFirebaseTokenRequest = Schema.Schema.Type<
  typeof UpdateFirebaseTokenRequestE
>

const ImportContactsRequest = z
  .object({
    contacts: z.array(HashedPhoneNumber).readonly(),
  })
  .readonly()
export const ImportContactsRequestE = Schema.Struct({
  contacts: Schema.Array(HashedPhoneNumberE),
})
export type ImportContactsRequest = Schema.Schema.Type<
  typeof ImportContactsRequestE
>

export const ImportContactsResponse = z
  .object({
    imported: z.boolean(),
    message: z.string().optional(),
  })
  .readonly()
export const ImportContactsResponseE = Schema.Struct({
  imported: Schema.Boolean,
  message: Schema.optional(Schema.String),
})

export type ImportContactsResponse = Schema.Schema.Type<
  typeof ImportContactsResponseE
>

export const FetchMyContactsRequest = PageRequest.extend({
  level: ConnectionLevel,
}).readonly()
export const FetchMyContactsRequestE = Schema.Struct({
  ...PageRequestE.fields,
  level: ConnectionLevelE,
})
export type FetchMyContactsRequest = Schema.Schema.Type<
  typeof FetchMyContactsRequestE
>

export const FetchMyContactsResponse = PageResponse.extend({
  items: z.array(z.object({publicKey: PublicKeyPemBase64})).readonly(),
}).readonly()
export const FetchMyContactsResponseE = Schema.Struct({
  ...PageResponseE.fields,
  items: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
    })
  ),
})
export type FetchMyContactsResponse = Schema.Schema.Type<
  typeof FetchMyContactsResponseE
>

export const FetchCommonConnectionsRequest = z
  .object({
    publicKeys: z.array(PublicKeyPemBase64).readonly(),
  })
  .readonly()
export const FetchCommonConnectionsRequestE = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type FetchCommonConnectionsRequest = Schema.Schema.Type<
  typeof FetchCommonConnectionsRequestE
>

export const FetchCommonConnectionsResponse = z
  .object({
    commonContacts: z
      .array(
        z
          .object({
            publicKey: PublicKeyPemBase64,
            common: z.object({hashes: z.array(HashedPhoneNumber)}).readonly(),
          })
          .readonly()
      )
      .readonly(),
  })
  .readonly()
export const FetchCommonConnectionsResponseE = Schema.Struct({
  commonContacts: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
      common: Schema.Struct({
        hashes: Schema.Array(HashedPhoneNumberE),
      }),
    })
  ),
})
export type FetchCommonConnectionsResponse = Schema.Schema.Type<
  typeof FetchCommonConnectionsResponseE
>

export const CheckUserExistsRequest = Schema.Struct({
  notifyExistingUserAboutLogin: BooleanfromString,
})

export const UserExistsResponse = z.object({
  exists: z.boolean(),
})
export const UserExistsResponseE = Schema.Struct({
  exists: Schema.Boolean,
})

export type UserExistsResponse = Schema.Schema.Type<typeof UserExistsResponseE>

export const HashDataWithValidation = Schema.Struct({})

export const HashWithSignature = Schema.Struct({
  hash: HashedPhoneNumberE,
  signature: EcdsaSignature,
})

export class UnableToVerifySignatureError extends Schema.TaggedError<UnableToVerifySignatureError>(
  'UnableToVerifySignatureError'
)(
  'UnableToVerifySignatureError',
  {
    status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  },
  {
    description:
      'Is thrown when updateBadOwnerHashRequest includes data that can not be verified against the signature...',
  }
) {}

export const UpdateBadOwnerHashErrors = Schema.Union(
  UnableToVerifySignatureError
)

export const UpdateBadOwnerHashRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  oldData: HashWithSignature,
  newData: HashWithSignature,
  removePreviousUser: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
})
export type UpdateBadOwnerHashRequest = Schema.Schema.Type<
  typeof UpdateBadOwnerHashRequest
>

export const UpdateBadOwnerHashResponse = z.object({
  updated: z.boolean(),
  willDeleteExistingUserIfRan: z.literal(true).optional(),
})

export const UpdateBadOwnerHashResponseE = Schema.Struct({
  updated: Schema.Boolean,
  willDeleteExistingUserIfRan: Schema.optional(Schema.Literal(true)),
})
export type UpdateBadOwnerHashResponse = Schema.Schema.Type<
  typeof UpdateBadOwnerHashResponseE
>
