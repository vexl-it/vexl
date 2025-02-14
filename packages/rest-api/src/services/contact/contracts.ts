import {
  PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  ClubAdmitionRequest,
  ClubCode,
  ClubInfoForUser,
  ClubLinkInfo,
  ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ConnectionLevelE} from '@vexl-next/domain/src/general/offers'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidChallengeError,
  RequestBaseWithChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
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
  expoToken: Schema.optionalWith(Schema.NullOr(ExpoNotificationTokenE), {
    default: () => null,
  }),
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

export const UpdateNotificationTokenRequest = Schema.Struct({
  expoToken: Schema.NullOr(ExpoNotificationTokenE),
})
export type UpdateNotificationTokenRequest =
  typeof UpdateNotificationTokenRequest.Type

export const ImportContactsRequest = Schema.Struct({
  contacts: Schema.Array(HashedPhoneNumberE),
  replace: Schema.optionalWith(Schema.Boolean, {default: () => true}),
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

// ---------
//   Clubs 👇
// ---------
export class ClubAlreadyExistsError extends Schema.TaggedError<ClubAlreadyExistsError>(
  'ClubAlreadyExistsError'
)('ClubAlreadyExistsError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class InvalidAdminTokenError extends Schema.TaggedError<InvalidAdminTokenError>(
  'InvalidAdminToken'
)('InvalidAdminToken', {
  status: Schema.optionalWith(Schema.Literal(403), {default: () => 403}),
}) {}

export class ClubUserLimitExceededError extends Schema.TaggedError<ClubUserLimitExceededError>(
  'ClubUserLimitExceededError'
)('ClubUserLimitExceededError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const AdminTokenParams = Schema.Struct({
  adminToken: Schema.String,
})

const ClubInfo = Schema.Struct({
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {as: 'Option'}),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriStringE,
  validUntil: Schema.DateFromString,
})

export const CreateClubErrors = Schema.Union(
  ClubAlreadyExistsError,
  InvalidAdminTokenError
)
export type CreateClubErrors = typeof CreateClubErrors.Type

export const CreateClubRequest = Schema.Struct({
  club: ClubInfo,
})
export type CreateClubRequest = typeof CreateClubRequest.Type

export const CreateClubResponse = Schema.Struct({
  clubInfo: ClubInfo,
})
export type CreateClubResponse = Schema.Schema.Type<typeof CreateClubResponse>

export const GenerateInviteLinkForAdminErrors = Schema.Union(
  NotFoundError,
  InvalidAdminTokenError
)
export type GenerateInviteLinkForAdminErrors =
  typeof GenerateInviteLinkForAdminErrors.Type

export const GenerateInviteLinkForAdminRequest = Schema.Struct({
  clubUuid: ClubUuid,
})
export type GenerateInviteLinkForAdminRequest =
  typeof GenerateInviteLinkForAdminRequest.Type

export const GenerateInviteLinkForAdminResponse = Schema.Struct({
  clubUuid: ClubUuid,
  link: ClubLinkInfo,
})
export type GenerateInviteLinkForAdminResponse =
  typeof GenerateInviteLinkForAdminResponse.Type

export const ModifyClubErrors = Schema.Union(
  NotFoundError,
  InvalidAdminTokenError
)
export type ModifyClubErrors = typeof ModifyClubErrors.Type

export const ModifyClubRequest = Schema.Struct({
  clubInfo: ClubInfo,
})
export type ModifyClubRequest = typeof ModifyClubRequest.Type

export const ModifyClubResponse = Schema.Struct({
  clubInfo: ClubInfo,
})
export type ModifyClubResponse = typeof ModifyClubResponse.Type

export const ListClubsErrors = Schema.Union(InvalidAdminTokenError)

export const ListClubsResponse = Schema.Struct({
  clubs: Schema.Array(ClubInfo),
})

export type ListClubsResponse = typeof ListClubsResponse.Type

export class MemberAlreadyInClubError extends Schema.TaggedError<MemberAlreadyInClubError>(
  'MemberAlreadyInClubError'
)('MemberAlreadyInClubError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const GetClubInfoRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  notificationToken: Schema.optionalWith(ExpoNotificationTokenE, {
    as: 'Option',
  }),
})

export type GetClubInfoRequest = typeof GetClubInfoRequest.Type

export const GetClubInfoResponse = Schema.Struct({
  clubInfoForUser: ClubInfoForUser,
})

export const GetClubInfoErrors = Schema.Union(
  InvalidChallengeError,
  NotFoundError
)

export const JoinClubRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  code: ClubCode,
  notificationToken: Schema.optionalWith(ExpoNotificationTokenE, {
    as: 'Option',
  }),
  contactsImported: Schema.Boolean,
})
export type JoinClubRequest = typeof JoinClubRequest.Type

export const JoinClubResponse = Schema.Struct({
  clubInfoForUser: ClubInfoForUser,
})
export type JoinClubResponse = typeof JoinClubResponse.Type

export const JoinClubErrors = Schema.Union(
  MemberAlreadyInClubError,
  NotFoundError,
  InvalidChallengeError,
  ClubUserLimitExceededError
)

export const LeaveClubRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
})
export type LeaveClubRequest = typeof LeaveClubRequest.Type

export const LeaveClubErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError
)

export class UserIsNotModeratorError extends Schema.TaggedError<UserIsNotModeratorError>(
  'UserIsNotModeratorError'
)('UserIsNotModeratorError', {
  status: Schema.optionalWith(Schema.Literal(403), {default: () => 403}),
}) {}

export const GenerateClubJoinLinkErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError,
  UserIsNotModeratorError
)

export const GenerateClubJoinLinkRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
})
export type GenerateClubJoinLinkRequest =
  typeof GenerateClubJoinLinkRequest.Type

export const GenerateClubJoinLinkResponse = Schema.Struct({
  clubUuid: ClubUuid,
  codeInfo: ClubLinkInfo,
})

export type GenerateClubJoinLinkResponse =
  typeof GenerateClubJoinLinkResponse.Type

export class InviteCodeNotFoundError extends Schema.TaggedError<InviteCodeNotFoundError>(
  'InviteCodeNotFoundError'
)('InviteCodeNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const DeactivateClubJoinLinkErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError,
  UserIsNotModeratorError,
  InviteCodeNotFoundError
)

export const DeactivateClubJoinLinkRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
  code: ClubCode,
})

export const DeactivateClubJoinLinkResponse = Schema.Struct({
  clubUuid: ClubUuid,
  deactivatedCode: ClubCode,
})
export type DeactivateClubJoinLinkResponse =
  typeof DeactivateClubJoinLinkResponse.Type

export type DeactivateClubJoinLinkRequest =
  typeof DeactivateClubJoinLinkRequest.Type

export const AddUserToTheClubErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError,
  UserIsNotModeratorError,
  ClubUserLimitExceededError,
  MemberAlreadyInClubError
)

export const AddUserToTheClubRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
  adminitionRequest: ClubAdmitionRequest,
})
export type AddUserToTheClubRequest = typeof AddUserToTheClubRequest.Type

export const AddUserToTheClubResponse = Schema.Struct({
  newCount: Schema.Number,
})
export type AddUserToTheClubResponse = typeof AddUserToTheClubResponse.Type

export const ListClubLinksErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError,
  UserIsNotModeratorError
)
export type ListClubLinksErrors = typeof ListClubLinksErrors.Type

export const ListClubLinksRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
})
export type ListClubLinksRequest = typeof ListClubLinksRequest.Type

export const ListClubLinksResponse = Schema.Struct({
  clubUuid: ClubUuid,
  links: Schema.Array(ClubLinkInfo),
})
export type ListClubLinksResponse = typeof ListClubLinksResponse.Type
export const GetClubContactsRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
})

export type GetClubContactsRequest = typeof GetClubContactsRequest.Type

export const GetClubContactsResponse = Schema.Struct({
  clubUuid: ClubUuid,
  items: Schema.Array(PublicKeyPemBase64E),
})

export type GetClubContactsResponse = typeof GetClubContactsResponse.Type

export const GetClubContactsErrors = Schema.Union(
  NotFoundError,
  InvalidChallengeError
)

export const GetClubInfoByAccessCodeRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  code: ClubCode,
})

export type GetClubInfoByAccessCodeRequest =
  typeof GetClubInfoByAccessCodeRequest.Type

export const GetClubInfoByAccessCodeResponse = Schema.Struct({
  club: ClubInfo,
})

export const GetClubInfoByAccessCodeErrors = Schema.Union(
  InvalidChallengeError,
  NotFoundError
)
