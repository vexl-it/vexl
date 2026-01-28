import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  ClubAdmitionRequest,
  ClubCode,
  ClubInfo,
  ClubInfoForUser,
  ClubLinkInfo,
  ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ConnectionLevel, OfferId} from '@vexl-next/domain/src/general/offers'
import {ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {ShortLivedTokenForErasingUserOnContactService} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Schema} from 'effect'
import {RequestBaseWithChallenge} from '../../challenges/contracts'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  createPageResponse,
  PageRequest,
  PageRequestMeta,
  PageResponse,
} from '../../Pagination.brand'

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

export class ForbiddenMessageTyperror extends Schema.TaggedError<ForbiddenMessageTyperror>(
  'ForbiddenMessageTyperror'
)('ForbiddenMessageTyperror', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class InitialImportContactsQuotaReachedError extends Schema.TaggedError<InitialImportContactsQuotaReachedError>(
  'InitialImportContactsQuotaReachedError'
)('InitialImportContactsQuotaReachedError', {
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

export class ImportContactsQuotaReachedError extends Schema.TaggedError<ImportContactsQuotaReachedError>(
  'ImportContactsQuotaReachedError'
)('ImportContactsQuotaReachedError', {
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

const CommonConnectionsForUserFromApi = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  common: Schema.Struct({
    hashes: Schema.Array(ServerToClientHashedNumber),
  }),
})

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>(
  'UserNotFoundError'
)('UserNotFoundError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  code: Schema.optionalWith(Schema.Literal('100101'), {
    default: () => '100101',
  }),
}) {}

export const CreateUserRequest = Schema.Struct({
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
  // todo #2124 remove after all clients are migrated to vexl notification tokens
  firebaseToken: Schema.NullOr(FcmToken),
  expoToken: Schema.optionalWith(Schema.NullOr(ExpoNotificationToken), {
    default: () => null,
  }),
})
export type CreateUserRequest = Schema.Schema.Type<typeof CreateUserRequest>

export const RefreshUserRequest = Schema.Struct({
  offersAlive: Schema.Boolean,
  countryPrefix: Schema.optionalWith(CountryPrefix, {
    as: 'Option',
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
  }),
})
export type RefreshUserRequest = Schema.Schema.Type<typeof RefreshUserRequest>

export const UpdateFirebaseTokenRequest = Schema.Struct({
  firebaseToken: Schema.NullOr(FcmToken),
})
export type UpdateFirebaseTokenRequest = typeof UpdateFirebaseTokenRequest.Type

export const UpdateNotificationTokenRequest = Schema.Struct({
  expoToken: Schema.NullOr(ExpoNotificationToken),
})
export type UpdateNotificationTokenRequest =
  typeof UpdateNotificationTokenRequest.Type

export const ImportContactsRequest = Schema.Struct({
  contacts: Schema.Array(HashedPhoneNumber),
  replace: Schema.optionalWith(Schema.Boolean, {default: () => true}),
})
export type ImportContactsRequest = typeof ImportContactsRequest.Type

export const ImportContactsResponse = Schema.Struct({
  imported: Schema.Boolean,
  phoneNumberHashesToServerToClientHash: Schema.Array(
    Schema.Struct({
      hashedNumber: HashedPhoneNumber,
      serverToClientHash: ServerToClientHashedNumber,
    })
  ),
  message: Schema.optional(Schema.String),
})

export type ImportContactsResponse = typeof ImportContactsResponse.Type

export const FetchMyContactsRequest = Schema.Struct({
  ...PageRequest.fields,
  level: ConnectionLevel,
})
export type FetchMyContactsRequest = typeof FetchMyContactsRequest.Type

export const FetchMyContactsResponse = Schema.Struct({
  ...PageResponse.fields,
  items: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64,
    })
  ),
})
export type FetchMyContactsResponse = typeof FetchMyContactsResponse.Type

export const FetchMyContactsPaginatedRequest = Schema.Struct({
  ...PageRequestMeta.fields,
  level: ConnectionLevel.pipe(Schema.pickLiteral('FIRST', 'SECOND')),
})

export type FetchMyContactsPaginatedRequest =
  typeof FetchMyContactsPaginatedRequest.Type

export const FetchMyContactsPaginatedResponse =
  createPageResponse(PublicKeyPemBase64)
export type FetchMyContactsPaginatedResponse =
  typeof FetchMyContactsPaginatedResponse.Type

export const FetchCommonConnectionsRequest = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64),
})
export type FetchCommonConnectionsRequest =
  typeof FetchCommonConnectionsRequest.Type

export const FetchCommonConnectionsResponse = Schema.Struct({
  commonContacts: Schema.Array(CommonConnectionsForUserFromApi),
})
export type FetchCommonConnectionsResponse =
  typeof FetchCommonConnectionsResponse.Type

export const FetchCommonConnectionsPaginatedRequest = Schema.Struct({
  ...PageRequestMeta.fields,
  publicKeys: Schema.Array(PublicKeyPemBase64),
})
export type FetchCommonConnectionsPaginatedRequest =
  typeof FetchCommonConnectionsPaginatedRequest.Type

export const FetchCommonConnectionsPaginatedResponse = createPageResponse(
  CommonConnectionsForUserFromApi
)
export type FetchCommonConnectionsPaginatedResponse =
  typeof FetchCommonConnectionsPaginatedResponse.Type

export const CheckUserExistsRequest = Schema.Struct({
  notifyExistingUserAboutLogin: BooleanFromString,
})
export type CheckUserExistsRequest = typeof CheckUserExistsRequest.Type

export const UserExistsResponse = Schema.Struct({
  exists: Schema.Boolean,
})
export type UserExistsResponse = Schema.Schema.Type<typeof UserExistsResponse>

export const HashDataWithValidation = Schema.Struct({})

export const HashWithSignature = Schema.Struct({
  hash: HashedPhoneNumber,
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

export const UpdateBadOwnerHashRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64,
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
  status: Schema.optionalWith(Schema.Literal(401), {default: () => 401}),
}) {}

export class ClubUserLimitExceededError extends Schema.TaggedError<ClubUserLimitExceededError>(
  'ClubUserLimitExceededError'
)('ClubUserLimitExceededError', {
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

export const AdminTokenParams = Schema.Struct({
  adminToken: Schema.String,
})

export const CreateClubRequest = Schema.Struct({
  club: ClubInfo,
})
export type CreateClubRequest = typeof CreateClubRequest.Type

export const CreateClubResponse = Schema.Struct({
  clubInfo: ClubInfo,
})
export type CreateClubResponse = Schema.Schema.Type<typeof CreateClubResponse>

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

export const ModifyClubRequest = Schema.Struct({
  clubInfo: ClubInfo,
})
export type ModifyClubRequest = typeof ModifyClubRequest.Type

export const ModifyClubResponse = Schema.Struct({
  clubInfo: ClubInfo,
})
export type ModifyClubResponse = typeof ModifyClubResponse.Type

export const ListClubsResponse = Schema.Struct({
  clubs: Schema.Array(ClubInfo),
})

export type ListClubsResponse = typeof ListClubsResponse.Type

export class S3ServiceError extends Schema.TaggedError<S3ServiceError>(
  'S3ServiceError'
)('S3ServiceError', {
  status: Schema.optionalWith(Schema.Literal(502), {default: () => 502}),
  message: Schema.optional(Schema.String),
}) {}

export const ImageExtension = Schema.Literal('png', 'jpg', 'jpeg')
export type ImageExtension = Schema.Schema.Type<typeof ImageExtension>

export const RequestClubImageUploadRequest = Schema.Struct({
  fileExtension: ImageExtension,
})
export type RequestClubImageUploadRequest =
  typeof RequestClubImageUploadRequest.Type

export const RequestClubImageUploadResponse = Schema.Struct({
  presignedUrl: Schema.String,
  s3Key: Schema.String,
  expiresIn: Schema.Number,
})
export type RequestClubImageUploadResponse =
  typeof RequestClubImageUploadResponse.Type

export class MemberAlreadyInClubError extends Schema.TaggedError<MemberAlreadyInClubError>(
  'MemberAlreadyInClubError'
)('MemberAlreadyInClubError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const GetClubInfoRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  // #2124 - remove notificationToken when fully migrated to VexlNotificationToken
  notificationToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
  }),
})

export type GetClubInfoRequest = typeof GetClubInfoRequest.Type

export const GetClubInfoResponse = Schema.Struct({
  clubInfoForUser: ClubInfoForUser,
})

export const JoinClubRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  code: ClubCode,
  // #2124 - remove notificationToken when fully migrated to VexlNotificationToken
  notificationToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
  }),
  contactsImported: Schema.Boolean,
})
export type JoinClubRequest = typeof JoinClubRequest.Type

export const JoinClubResponse = Schema.Struct({
  clubInfoForUser: ClubInfoForUser,
})
export type JoinClubResponse = typeof JoinClubResponse.Type

export const LeaveClubRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  clubUuid: ClubUuid,
})
export type LeaveClubRequest = typeof LeaveClubRequest.Type

export class UserIsNotModeratorError extends Schema.TaggedError<UserIsNotModeratorError>(
  'UserIsNotModeratorError'
)('UserIsNotModeratorError', {
  status: Schema.optionalWith(Schema.Literal(403), {default: () => 403}),
}) {}

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
  items: Schema.Array(PublicKeyPemBase64),
})

export type GetClubContactsResponse = typeof GetClubContactsResponse.Type

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

export class ReportClubLimitReachedError extends Schema.TaggedError<ReportClubLimitReachedError>(
  'ReportClubLimitReachedError'
)('ReportClubLimitReachedError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export const ReportClubRequest = Schema.Struct({
  offerId: OfferId,
  clubUuid: ClubUuid,
  ...RequestBaseWithChallenge.fields,
})
export type ReportClubRequest = Schema.Schema.Type<typeof ReportClubRequest>

export const ReportClubResponse = NoContentResponse

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

export const ConvertPhoneNumberHashesToServerHashesRequest = Schema.Struct({
  hashedPhoneNumbers: Schema.Array(HashedPhoneNumber),
})
export type ConvertPhoneNumberHashesToServerHashesRequest =
  typeof ConvertPhoneNumberHashesToServerHashesRequest.Type

export const ConvertPhoneNumberHashesToServerHashesResponse = Schema.Struct({
  result: Schema.Array(
    Schema.Struct({
      hashedNumber: HashedPhoneNumber,
      serverToClientHash: ServerToClientHashedNumber,
    })
  ),
})
export type ConvertPhoneNumberHashesToServerHashesResponse =
  typeof ConvertPhoneNumberHashesToServerHashesResponse.Type
