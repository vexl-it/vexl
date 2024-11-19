import {
  PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ConnectionLevelE} from '@vexl-next/domain/src/general/offers'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Schema} from 'effect'
import {z} from 'zod'
import {PageRequest, PageResponse} from '../../Pagination.brand'

export class InboxDoesNotExistError extends Schema.TaggedError<InboxDoesNotExistError>(
  'InboxDoesNotExist'
)('InboxDoesNotExist', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal('100101'), {
    default: () => '100101',
  }),
}) {}

export class NotPermittedToSendMessageToTargetInboxError extends Schema.TaggedError<NotPermittedToSendMessageToTargetInboxError>(
  'NotPermittedToSendMessageToTargetInbox'
)('NotPermittedToSendMessageToTargetInbox', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  code: Schema.optionalWith(Schema.Literal('100102'), {
    default: () => '100102',
  }),
}) {}

export class ForbiddenMessageTypeError extends Schema.TaggedError<ForbiddenMessageTypeError>(
  'ForbiddenMessageTypeError'
)('ForbiddenMessageTypeError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class InitialImportContactsQuotaReachedError extends Schema.TaggedError<InitialImportContactsQuotaReachedError>(
  'InitialImportContactsQuotaReachedError'
)('InitialImportContactsQuotaReachedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class ImportContactsQuotaReachedError extends Schema.TaggedError<ImportContactsQuotaReachedError>(
  'ImportContactsQuotaReachedError'
)('ImportContactsQuotaReachedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>(
  'UserNotFoundError'
)('UserNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal('100101'), {
    default: () => '100101',
  }),
}) {}

export const CreateUserRequest = Schema.Struct({
  firebaseToken: Schema.NullOr(FcmTokenE),
})
export type CreateUserRequest = Schema.Schema.Type<typeof CreateUserRequest>

export const RefreshUserRequest = Schema.Struct({
  offersAlive: Schema.Boolean,
  countryPrefix: Schema.optionalWith(CountryPrefixE, {
    as: 'Option',
  }),
})
export type RefreshUserRequest = Schema.Schema.Type<typeof RefreshUserRequest>

export const UpdateFirebaseTokenRequest = Schema.Struct({
  firebaseToken: Schema.NullOr(FcmTokenE),
})
export type UpdateFirebaseTokenRequest = typeof UpdateFirebaseTokenRequest.Type

export const ImportContactsRequest = Schema.Struct({
  contacts: Schema.Array(HashedPhoneNumberE),
})
export type ImportContactsRequest = typeof ImportContactsRequest.Type

export const ImportContactsResponse = Schema.Struct({
  imported: Schema.Boolean,
  message: Schema.optional(Schema.String),
})

export type ImportContactsResponse = typeof ImportContactsResponse.Type

export const FetchMyContactsRequest = Schema.Struct({
  ...PageRequest.fields,
  level: ConnectionLevelE,
})
export type FetchMyContactsRequest = typeof FetchMyContactsRequest.Type

export const FetchMyContactsResponseE = Schema.Struct({
  ...PageResponse.fields,
  items: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64E,
    })
  ),
})
export type FetchMyContactsResponse = typeof FetchMyContactsResponseE.Type

export const FetchCommonConnectionsRequest = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type FetchCommonConnectionsRequest =
  typeof FetchCommonConnectionsRequest.Type

export const FetchCommonConnectionsResponse = z
  .object({
    commonContacts: z
      .array(
        z
          .object({
            publicKey: PublicKeyPemBase64,
            common: z
              .object({hashes: z.array(HashedPhoneNumber).readonly()})
              .readonly(),
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
export type FetchCommonConnectionsResponse =
  typeof FetchCommonConnectionsResponseE.Type

export const CheckUserExistsRequest = Schema.Struct({
  notifyExistingUserAboutLogin: BooleanFromString,
})

export const UserExistsResponse = Schema.Struct({
  exists: Schema.Boolean,
})
export type UserExistsResponse = Schema.Schema.Type<typeof UserExistsResponse>

export const ImportContactsErrors = Schema.Union(
  InitialImportContactsQuotaReachedError,
  ImportContactsQuotaReachedError
)

export const CheckUserExistsInput = Schema.Struct({
  query: CheckUserExistsRequest,
})
export type CheckUserExistsInput = typeof CheckUserExistsInput.Type

export const CreateUserInput = Schema.Struct({
  body: CreateUserRequest,
})
export type CreateUserInput = Schema.Schema.Type<typeof CreateUserInput>

export const RefreshUserInput = Schema.Struct({
  body: RefreshUserRequest,
})
export type RefreshUserInput = Schema.Schema.Type<typeof RefreshUserInput>

export const UpdateFirebaseTokenInput = Schema.Struct({
  body: UpdateFirebaseTokenRequest,
})
export type UpdateFirebaseTokenInput = typeof UpdateFirebaseTokenInput.Type

export const ImportContactsInput = Schema.Struct({
  body: ImportContactsRequest,
})
export type ImportContactsInput = Schema.Schema.Type<typeof ImportContactsInput>

export const FetchMyContactsInput = Schema.Struct({
  query: FetchMyContactsRequest,
})
export type FetchMyContactsInput = typeof FetchMyContactsInput.Type

export const FetchCommonConnectionsInput = Schema.Struct({
  body: FetchCommonConnectionsRequest,
})
export type FetchCommonConnectionsInput =
  typeof FetchCommonConnectionsInput.Type
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
export type UpdateBadOwnerHashRequest = typeof UpdateBadOwnerHashRequest.Type

export const UpdateBadOwnerHashResponse = Schema.Struct({
  updated: Schema.Boolean,
  willDeleteExistingUserIfRan: Schema.optional(Schema.Literal(true)),
})
export type UpdateBadOwnerHashResponse = typeof UpdateBadOwnerHashResponse.Type
