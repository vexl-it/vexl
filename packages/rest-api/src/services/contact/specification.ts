import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from '@effect/platform/index'
import {
  InvalidNextPageTokenError,
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {BadShortLivedTokenForErasingUserOnContactServiceError} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {InvalidChallengeError} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  AddUserToTheClubRequest,
  AddUserToTheClubResponse,
  AdminTokenParams,
  CheckUserExistsRequest,
  ClubAlreadyExistsError,
  ClubUserLimitExceededError,
  ConvertPhoneNumberHashesToServerHashesRequest,
  ConvertPhoneNumberHashesToServerHashesResponse,
  CreateClubRequest,
  CreateClubResponse,
  CreateUserRequest,
  DeactivateClubJoinLinkRequest,
  DeactivateClubJoinLinkResponse,
  EraseUserFromNetworkRequest,
  EraseUserFromNetworkResponse,
  FetchCommonConnectionsPaginatedRequest,
  FetchCommonConnectionsPaginatedResponse,
  FetchCommonConnectionsRequest,
  FetchCommonConnectionsResponse,
  FetchMyContactsPaginatedRequest,
  FetchMyContactsPaginatedResponse,
  FetchMyContactsRequest,
  FetchMyContactsResponse,
  GenerateClubJoinLinkRequest,
  GenerateClubJoinLinkResponse,
  GenerateInviteLinkForAdminRequest,
  GenerateInviteLinkForAdminResponse,
  GetClubContactsRequest,
  GetClubContactsResponse,
  GetClubInfoByAccessCodeRequest,
  GetClubInfoByAccessCodeResponse,
  GetClubInfoRequest,
  GetClubInfoResponse,
  ImportContactsQuotaReachedError,
  ImportContactsRequest,
  ImportContactsResponse,
  InitialImportContactsQuotaReachedError,
  InvalidAdminTokenError,
  InviteCodeNotFoundError,
  JoinClubRequest,
  JoinClubResponse,
  LeaveClubRequest,
  ListClubLinksRequest,
  ListClubLinksResponse,
  ListClubsResponse,
  MemberAlreadyInClubError,
  ModifyClubRequest,
  ModifyClubResponse,
  RefreshUserRequest,
  ReportClubLimitReachedError,
  ReportClubRequest,
  ReportClubResponse,
  RequestClubImageUploadRequest,
  RequestClubImageUploadResponse,
  S3ServiceError,
  SendBulkNotificationError,
  SendBulkNotificationRequest,
  SendBulkNotificationResponse,
  UnableToVerifySignatureError,
  UpdateBadOwnerHashRequest,
  UpdateBadOwnerHashResponse,
  UpdateFirebaseTokenRequest,
  UpdateNotificationTokenRequest,
  UserExistsResponse,
  UserIsNotModeratorError,
  UserNotFoundError,
} from './contracts'

export const CheckUserExistsEndpoint = HttpApiEndpoint.post(
  'checkUserExists',
  '/api/v1/users/check-exists'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setUrlParams(CheckUserExistsRequest)
  .addSuccess(UserExistsResponse)
  .annotate(MaxExpectedDailyCall, 1)

export const CreateUserEndpoint = HttpApiEndpoint.post(
  'createUser',
  '/api/v1/users'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(CreateUserRequest)
  .addSuccess(NoContentResponse, {status: 201})
  .annotate(MaxExpectedDailyCall, 1)

export const RefreshUserEndpoint = HttpApiEndpoint.post(
  'refreshUser',
  '/api/v1/users/refresh'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(RefreshUserRequest)
  .addSuccess(NoContentResponse)
  .addError(UserNotFoundError, {status: 404})
  .annotate(MaxExpectedDailyCall, 1)

export const UpdateFirebaseTokenEndpoint = HttpApiEndpoint.put(
  'updateFirebaseToken',
  '/api/v1/users'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(UpdateFirebaseTokenRequest)
  .addError(UserNotFoundError, {status: 404})
  .addSuccess(NoContentResponse)
  .annotate(OpenApi.Deprecated, true)
  .annotate(MaxExpectedDailyCall, 1)

export const UpdateNotificationTokenEndpoint = HttpApiEndpoint.put(
  'updateNotificationToken',
  '/api/v1/users/notification-token'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(UpdateNotificationTokenRequest)
  .addSuccess(NoContentResponse)
  .addError(UserNotFoundError, {status: 404})
  .annotate(MaxExpectedDailyCall, 1)

export const DeleteUserEndpoint = HttpApiEndpoint.del(
  'deleteUser',
  '/api/v1/users/me'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .addSuccess(NoContentResponse)
  .annotate(MaxExpectedDailyCall, 1)

export const EraseUserFromNetworkEndpoint = HttpApiEndpoint.del(
  'eraseUserFromNetwork',
  '/api/v1/users/erase'
)
  .setPayload(EraseUserFromNetworkRequest)
  .addSuccess(EraseUserFromNetworkResponse)
  .addError(BadShortLivedTokenForErasingUserOnContactServiceError, {
    status: 400,
  })
  .annotate(MaxExpectedDailyCall, 1)

export const ImportContactsEndpoint = HttpApiEndpoint.post(
  'importContacts',
  '/api/v1/contacts/import/replace'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(ImportContactsRequest)
  .addSuccess(ImportContactsResponse)
  .addError(InitialImportContactsQuotaReachedError, {status: 429})
  .addError(ImportContactsQuotaReachedError, {status: 429})
  .annotate(MaxExpectedDailyCall, 100)

export const FetchMyContactsEndpoint = HttpApiEndpoint.get(
  'fetchMyContacts',
  '/api/v1/contacts/me'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setUrlParams(FetchMyContactsRequest)
  .addSuccess(FetchMyContactsResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const FetchMyContactsPaginatedEndpoint = HttpApiEndpoint.get(
  'fetchMyContactsPaginated',
  '/api/v1/contacts/me/paginated'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setUrlParams(FetchMyContactsPaginatedRequest)
  .addSuccess(FetchMyContactsPaginatedResponse)
  .addError(InvalidNextPageTokenError, {status: 400})
  .annotate(MaxExpectedDailyCall, 500)

export const FetchCommonConnectionsEndpoint = HttpApiEndpoint.post(
  'fetchCommonConnections',
  '/api/v1/contacts/common'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(FetchCommonConnectionsRequest)
  .addSuccess(FetchCommonConnectionsResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const FetchCommonConnectionsPaginatedEndpoint = HttpApiEndpoint.post(
  'fetchCommonConnectionsPaginated',
  '/api/v1/contacts/common/paginated'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(FetchCommonConnectionsPaginatedRequest)
  .addSuccess(FetchCommonConnectionsPaginatedResponse)
  .addError(InvalidNextPageTokenError, {status: 400})
  .annotate(MaxExpectedDailyCall, 500)

export const ConvertPhoneNumberHashesToServerHashesEndpoint =
  HttpApiEndpoint.post(
    'convertPhoneNumberHashesToServerHashes',
    '/api/v1/contacts/convert-to-server-hashes'
  )
    .setPayload(ConvertPhoneNumberHashesToServerHashesRequest)
    .addSuccess(ConvertPhoneNumberHashesToServerHashesResponse)
    .annotate(MaxExpectedDailyCall, 100)

export const UpdateBadOwnerHashEndpoint = HttpApiEndpoint.post(
  'updateBadOwnerHash',
  '/api/v1/update-bad-owner-hash'
)
  .setPayload(UpdateBadOwnerHashRequest)
  .addSuccess(UpdateBadOwnerHashResponse)
  .addError(UnableToVerifySignatureError, {status: 400})
  .annotate(MaxExpectedDailyCall, 1)

export const CreateClubEndpoint = HttpApiEndpoint.post(
  'createClub',
  '/api/v1/clubs/admin'
)
  .setUrlParams(AdminTokenParams)
  .setPayload(CreateClubRequest)
  .addSuccess(CreateClubResponse)
  .addError(ClubAlreadyExistsError, {status: 400})
  .addError(InvalidAdminTokenError, {status: 401})
  .annotate(MaxExpectedDailyCall, 100)

export const ModfiyClubEndpoint = HttpApiEndpoint.put(
  'modifyClub',
  '/api/v1/clubs/admin'
)
  .setUrlParams(AdminTokenParams)
  .setPayload(ModifyClubRequest)
  .addSuccess(ModifyClubResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .annotate(MaxExpectedDailyCall, 100)

export const GenerateClubInviteLinkForAdminEndpoint = HttpApiEndpoint.put(
  'generateClubInviteLinkForAdmin',
  '/api/v1/clubs/admin/generate-admin-link'
)
  .setUrlParams(AdminTokenParams)
  .setPayload(GenerateInviteLinkForAdminRequest)
  .addSuccess(GenerateInviteLinkForAdminResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .annotate(MaxExpectedDailyCall, 10000)

export const ListClubsEndpoint = HttpApiEndpoint.get(
  'listClubs',
  '/api/v1/clubs/admin'
)
  .setUrlParams(AdminTokenParams)
  .addSuccess(ListClubsResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .annotate(MaxExpectedDailyCall, 100)

export const RequestClubImageUploadEndpoint = HttpApiEndpoint.post(
  'requestClubImageUpload',
  '/api/v1/clubs/admin/request-image-upload'
)
  .setUrlParams(AdminTokenParams)
  .setPayload(RequestClubImageUploadRequest)
  .addSuccess(RequestClubImageUploadResponse)
  .addError(InvalidAdminTokenError, {status: 401})
  .addError(S3ServiceError, {status: 502})
  .annotate(MaxExpectedDailyCall, 1000)

export const GetClubInfoEndpoint = HttpApiEndpoint.post(
  'getClubInfo',
  '/api/v1/clubs/member/get-info'
)
  .setPayload(GetClubInfoRequest)
  .addSuccess(GetClubInfoResponse)
  .addError(InvalidChallengeError, {status: 401})
  .annotate(MaxExpectedDailyCall, 500)

export const JoinClubEndpoint = HttpApiEndpoint.post(
  'joinClub',
  '/api/v1/clubs/member/join-club'
)
  .setPayload(JoinClubRequest)
  .addSuccess(JoinClubResponse)
  .addError(MemberAlreadyInClubError, {status: 400})
  .addError(InvalidChallengeError, {status: 401})
  .addError(ClubUserLimitExceededError, {status: 429})
  .annotate(MaxExpectedDailyCall, 10)

export const LeaveClubEndpoint = HttpApiEndpoint.post(
  'leaveClub',
  '/api/v1/clubs/member/leave-club'
)
  .setPayload(LeaveClubRequest)
  .addSuccess(NoContentResponse)
  .addError(InvalidChallengeError, {status: 401})
  .annotate(MaxExpectedDailyCall, 10)

export const GenerateClubJoinLinkEndpoint = HttpApiEndpoint.post(
  'generateClubJoinLink',
  '/api/v1/clubs/moderator/generate-join-link'
)
  .setPayload(GenerateClubJoinLinkRequest)
  .addSuccess(GenerateClubJoinLinkResponse)
  .addError(InvalidChallengeError, {status: 401})
  .addError(UserIsNotModeratorError, {status: 403})
  .annotate(MaxExpectedDailyCall, 10)

export const DeactivateClubJoinLinkEndpoint = HttpApiEndpoint.del(
  'deactivateClubJoinLink',
  '/api/v1/clubs/moderator/deactivate-join-link'
)
  .setPayload(DeactivateClubJoinLinkRequest)
  .addSuccess(DeactivateClubJoinLinkResponse)
  .addError(InviteCodeNotFoundError, {status: 400})
  .addError(InvalidChallengeError, {status: 401})
  .addError(UserIsNotModeratorError, {status: 403})
  .annotate(MaxExpectedDailyCall, 10)

export const AddUserToTheClubEndpint = HttpApiEndpoint.post(
  'addUserToTheClub',
  '/api/v1/clubs/moderator/add-user-to-club'
)
  .setPayload(AddUserToTheClubRequest)
  .addSuccess(AddUserToTheClubResponse)
  .addError(MemberAlreadyInClubError, {status: 400})
  .addError(InvalidChallengeError, {status: 401})
  .addError(UserIsNotModeratorError, {status: 403})
  .addError(ClubUserLimitExceededError, {status: 429})
  .annotate(MaxExpectedDailyCall, 1000)

export const ListClubLinksEndpoint = HttpApiEndpoint.post(
  'listClubLinks',
  '/api/v1/clubs/moderator/list-links'
)
  .setPayload(ListClubLinksRequest)
  .addSuccess(ListClubLinksResponse)
  .addError(InvalidChallengeError, {status: 401})
  .addError(UserIsNotModeratorError, {status: 403})
  .annotate(MaxExpectedDailyCall, 100)

export const GetClubContactsEndpoint = HttpApiEndpoint.post(
  'getClubContacts',
  '/api/v1/clubs/member/get-contacts'
)
  .setPayload(GetClubContactsRequest)
  .addSuccess(GetClubContactsResponse)
  .addError(InvalidChallengeError, {status: 401})
  .annotate(MaxExpectedDailyCall, 500)

export const GetClubInfoByAccessCodeEndpoint = HttpApiEndpoint.post(
  'getClubInfoByAccessCode',
  '/api/v1/clubs/member/get-info-by-access-code'
)
  .setPayload(GetClubInfoByAccessCodeRequest)
  .addSuccess(GetClubInfoByAccessCodeResponse)
  .addError(InvalidChallengeError, {status: 401})
  .annotate(MaxExpectedDailyCall, 100)

export const ReportClubEndpoint = HttpApiEndpoint.post(
  'reportClub',
  '/api/v1/clubs/member/report-club'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(ReportClubRequest)
  .addSuccess(ReportClubResponse)
  .addError(InvalidChallengeError, {status: 401})
  .addError(ReportClubLimitReachedError, {status: 429})
  .annotate(MaxExpectedDailyCall, 10)

export const SendBulkNotificationEndpoint = HttpApiEndpoint.post(
  'sendBulkNotification',
  '/api/v1/notifications/bulk'
)
  .setUrlParams(AdminTokenParams)
  .setPayload(SendBulkNotificationRequest)
  .addSuccess(SendBulkNotificationResponse)
  .addError(SendBulkNotificationError, {status: 400})
  .addError(InvalidAdminTokenError, {status: 401})
  .annotate(MaxExpectedDailyCall, 10)

const UserApiGroup = HttpApiGroup.make('User')
  .add(CheckUserExistsEndpoint)
  .add(CreateUserEndpoint)
  .add(RefreshUserEndpoint)
  .add(UpdateFirebaseTokenEndpoint)
  .add(UpdateNotificationTokenEndpoint)
  .add(DeleteUserEndpoint)
  .add(UpdateBadOwnerHashEndpoint)
  .add(EraseUserFromNetworkEndpoint)

const ContactApiGroup = HttpApiGroup.make('Contact')
  .add(ImportContactsEndpoint)
  .add(ConvertPhoneNumberHashesToServerHashesEndpoint)
  .add(FetchMyContactsEndpoint)
  .add(FetchMyContactsPaginatedEndpoint)
  .add(FetchCommonConnectionsEndpoint)
  .add(FetchCommonConnectionsPaginatedEndpoint)

const ClubsAdminApiGroup = HttpApiGroup.make('ClubsAdmin')
  .add(CreateClubEndpoint)
  .add(ModfiyClubEndpoint)
  .add(GenerateClubInviteLinkForAdminEndpoint)
  .add(ListClubsEndpoint)
  .add(RequestClubImageUploadEndpoint)

const ClubsMemberApiGroup = HttpApiGroup.make('ClubsMember')
  .add(GetClubInfoEndpoint)
  .add(JoinClubEndpoint)
  .add(LeaveClubEndpoint)
  .add(GetClubContactsEndpoint)
  .add(GetClubInfoByAccessCodeEndpoint)
  .add(ReportClubEndpoint)

const ClubsModeratorApiGroup = HttpApiGroup.make('ClubsModerator')
  .add(GenerateClubJoinLinkEndpoint)
  .add(DeactivateClubJoinLinkEndpoint)
  .add(AddUserToTheClubEndpint)
  .add(ListClubLinksEndpoint)

const AdminApiGroup = HttpApiGroup.make('Admin').add(
  SendBulkNotificationEndpoint
)

export const ContactApiSpecification = HttpApi.make('Contact API')
  .middleware(RateLimitingMiddleware)
  .add(UserApiGroup)
  .add(ContactApiGroup)
  .add(ClubsAdminApiGroup)
  .add(ClubsMemberApiGroup)
  .add(ClubsModeratorApiGroup)
  .add(AdminApiGroup)
  .add(ChallengeApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
