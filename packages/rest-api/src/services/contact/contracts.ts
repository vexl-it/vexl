import {
  PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  ClubAdmitionRequest,
  ClubCode,
  ClubInfo,
  ClubInfoForUser,
  ClubLinkInfo,
  ClubUuidE,
} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ConnectionLevelE, OfferIdE} from '@vexl-next/domain/src/general/offers'
import {
  BadShortLivedTokenForErasingUserOnContactServiceError,
  ShortLivedTokenForErasingUserOnContactService,
} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'

import {Schema} from 'effect'
import {z} from 'zod'
import {
  InvalidChallengeError,
  RequestBaseWithChallenge,
} from '../../challenges/contracts'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {PageRequest, PageResponse} from '../../Pagination.brand'
import {PlatformName} from '../../PlatformName'

export class InboxDoesNotExistError extends Schema.TaggedError<InboxDoesNotExistError>(
  'InboxDoesNotExist'
)('InboxDoesNotExist', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal('100101'), {
    default: () => '100101',
  }),
}) {}

export class NotPermittedToSendMessageToTargetInboxError extends Schema.TaggedError<NotPermittedToSendMessageToTargetInboxError>(
  'NotPermittedToSendMessageToTargetInboxError'
)('NotPermittedToSendMessageToTargetInboxError', {
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
  clubUuid: ClubUuidE,
})
export type GenerateInviteLinkForAdminRequest =
  typeof GenerateInviteLinkForAdminRequest.Type

export const GenerateInviteLinkForAdminResponse = Schema.Struct({
  clubUuid: ClubUuidE,
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
  clubUuid: ClubUuidE,
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
  clubUuid: ClubUuidE,
})
export type GenerateClubJoinLinkRequest =
  typeof GenerateClubJoinLinkRequest.Type

export const GenerateClubJoinLinkResponse = Schema.Struct({
  clubUuid: ClubUuidE,
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
  clubUuid: ClubUuidE,
  code: ClubCode,
})

export const DeactivateClubJoinLinkResponse = Schema.Struct({
  clubUuid: ClubUuidE,
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
  clubUuid: ClubUuidE,
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
  clubUuid: ClubUuidE,
})
export type ListClubLinksRequest = typeof ListClubLinksRequest.Type

export const ListClubLinksResponse = Schema.Struct({
  clubUuid: ClubUuidE,
  links: Schema.Array(ClubLinkInfo),
})
export type ListClubLinksResponse = typeof ListClubLinksResponse.Type
export const GetClubContactsRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuidE,
})

export type GetClubContactsRequest = typeof GetClubContactsRequest.Type

export const GetClubContactsResponse = Schema.Struct({
  clubUuid: ClubUuidE,
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
  isModerator: Schema.Boolean,
})

export const GetClubInfoByAccessCodeErrors = Schema.Union(
  InvalidChallengeError,
  NotFoundError
)

export class ReportClubLimitReachedError extends Schema.TaggedError<ReportClubLimitReachedError>(
  'ReportClubLimitReachedError'
)('ReportClubLimitReachedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const ReportClubRequest = Schema.Struct({
  offerId: OfferIdE,
  clubUuid: ClubUuidE,
  ...RequestBaseWithChallenge.fields,
})
export type ReportClubRequest = Schema.Schema.Type<typeof ReportClubRequest>

export const ReportClubResponse = NoContentResponse

export const ReportClubErrors = Schema.Union(
  InvalidChallengeError,
  ReportClubLimitReachedError
)

export class SendBulkNotificationError extends Schema.TaggedError<SendBulkNotificationError>(
  'SendBulkNotificationError'
)('SendBulkNotificationError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  description: Schema.String,
}) {}
export const SendBulkNotificationsErrors = Schema.Union(
  SendBulkNotificationError,
  InvalidAdminTokenError
)

export const SendBulkNotificationRequest = Schema.Struct({
  dryRun: Schema.Boolean,
  filters: Schema.Struct({
    versionFromIncluded: Schema.optionalWith(Schema.Number, {
      as: 'Option',
      nullable: true,
    }),
    versionToIncluded: Schema.optionalWith(Schema.Number, {
      as: 'Option',
      nullable: true,
    }),
    platform: Schema.Array(PlatformName),
    fcm: Schema.Boolean,
    expo: Schema.Boolean,
  }),
  notification: Schema.Struct({
    title: Schema.String,
    body: Schema.String,
    data: Schema.optionalWith(
      Schema.Record({key: Schema.String, value: Schema.String}),
      {as: 'Option', nullable: true}
    ),
  }),
})

export const SendBulkNotificationResponse = Schema.Struct({
  sentCount: Schema.Number,
  dryRun: Schema.Boolean,
  expo: Schema.Struct({
    failed: Schema.Number,
    success: Schema.Number,
  }),
  fcm: Schema.Struct({
    failed: Schema.Number,
    success: Schema.Number,
  }),
})
export type SendBulkNotificationResponse =
  typeof SendBulkNotificationResponse.Type

export const EraseUserFromNetworkRequest = Schema.Struct({
  token: ShortLivedTokenForErasingUserOnContactService,
})
export type EraseUserFromNetworkRequest =
  typeof EraseUserFromNetworkRequest.Type

export const EraseUserFromNetworkResponse = Schema.Struct({
  erased: Schema.Literal('ok'),
})
export type EraseUserFromNetworkResponse =
  typeof EraseUserFromNetworkResponse.Type

export const EraseUserFromNetworkErrors = Schema.Union(
  BadShortLivedTokenForErasingUserOnContactServiceError
)
export type EraseUserFromNetworkErrors = typeof EraseUserFromNetworkErrors.Type
