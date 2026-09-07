import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {BadShortLivedTokenForErasingUserOnContactServiceError} from '@vexl-next/domain/src/general/ShortLivedTokenForErasingUserOnContactService'
import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import {AdminTokenHeaders} from '../../adminTokenHeaders'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {
  InvalidChallengeError,
  KeyAlreadySetError,
  PublicKeyV2MissingError,
} from '../../challenges/contracts'
import {ChallengeApiGroup} from '../../challenges/specification'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  AddUserToTheClubRequest,
  AddUserToTheClubResponse,
  CheckUserExistsRequest,
  ClubAlreadyExistsError,
  ClubCannotBeReactivatedError,
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
  FetchMyContactsPaginatedRequest,
  FetchMyContactsPaginatedResponse,
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
  GetClubStatsRequest,
  GetClubStatsResponse,
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
  ReactivateClubRequest,
  ReactivateClubResponse,
  RefreshUserRequest,
  ReportClubLimitReachedError,
  ReportClubRequest,
  ReportClubResponse,
  RequestClubImageUploadRequest,
  RequestClubImageUploadResponse,
  S3ServiceError,
  SetPublicKeyV2Request,
  UpdateNotificationTokenRequest,
  UserExistsResponse,
  UserIsNotModeratorError,
  UserNotFoundError,
} from './contracts'

export const CheckUserExistsEndpoint = HttpApiEndpoint.post(
  'checkUserExists',
  '/api/v1/users/check-exists',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    query: CheckUserExistsRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: UserExistsResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 1)

export const CreateUserEndpoint = HttpApiEndpoint.post(
  'createUser',
  '/api/v1/users',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: CreateUserRequest,
    error: Schema.Union([...commonApiErrors]),
    success: NoContentResponse.pipe(HttpApiSchema.status(201)),
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 1)

export const RefreshUserEndpoint = HttpApiEndpoint.post(
  'refreshUser',
  '/api/v1/users/refresh',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: RefreshUserRequest,
    error: Schema.Union([
      ...commonApiErrors,
      UserNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: NoContentResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 1)

export const UpdateNotificationTokenEndpoint = HttpApiEndpoint.put(
  'updateNotificationToken',
  '/api/v1/users/notification-token',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: UpdateNotificationTokenRequest,
    error: Schema.Union([
      ...commonApiErrors,
      UserNotFoundError.pipe(HttpApiSchema.status(404)),
    ]),
    success: NoContentResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 1)

export const DeleteUserEndpoint = HttpApiEndpoint.delete(
  'deleteUser',
  '/api/v1/users/me',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    error: Schema.Union([...commonApiErrors]),
    success: NoContentResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 1)

export const EraseUserFromNetworkEndpoint = HttpApiEndpoint.delete(
  'eraseUserFromNetwork',
  '/api/v1/users/erase',
  {
    disableCodecs: true,
    payload: EraseUserFromNetworkRequest,
    error: Schema.Union([
      ...commonApiErrors,
      BadShortLivedTokenForErasingUserOnContactServiceError.pipe(
        HttpApiSchema.status(
          {
            status: 400,
          }.status
        )
      ),
    ]),
    success: EraseUserFromNetworkResponse,
  }
).annotate(MaxExpectedDailyCall, 1)

export const ImportContactsEndpoint = HttpApiEndpoint.post(
  'importContacts',
  '/api/v1/contacts/import/replace',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: ImportContactsRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InitialImportContactsQuotaReachedError.pipe(HttpApiSchema.status(429)),
      ImportContactsQuotaReachedError.pipe(HttpApiSchema.status(429)),
    ]),
    success: ImportContactsResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const FetchMyContactsPaginatedEndpoint = HttpApiEndpoint.get(
  'fetchMyContactsPaginated',
  '/api/v1/contacts/me/paginated',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    query: FetchMyContactsPaginatedRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidNextPageTokenError.pipe(HttpApiSchema.status(400)),
    ]),
    success: FetchMyContactsPaginatedResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 500)

export const FetchCommonConnectionsPaginatedEndpoint = HttpApiEndpoint.post(
  'fetchCommonConnectionsPaginated',
  '/api/v1/contacts/common/paginated',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: FetchCommonConnectionsPaginatedRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidNextPageTokenError.pipe(HttpApiSchema.status(400)),
    ]),
    success: FetchCommonConnectionsPaginatedResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 500)

export const ConvertPhoneNumberHashesToServerHashesEndpoint =
  HttpApiEndpoint.post(
    'convertPhoneNumberHashesToServerHashes',
    '/api/v1/contacts/convert-to-server-hashes',
    {
      disableCodecs: true,
      payload: ConvertPhoneNumberHashesToServerHashesRequest,
      error: Schema.Union([...commonApiErrors]),
      success: ConvertPhoneNumberHashesToServerHashesResponse,
    }
  ).annotate(MaxExpectedDailyCall, 100)

export const CreateClubEndpoint = HttpApiEndpoint.post(
  'createClub',
  '/api/v1/clubs/admin',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: CreateClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ClubAlreadyExistsError.pipe(HttpApiSchema.status(400)),
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
    ]),
    success: CreateClubResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const ModfiyClubEndpoint = HttpApiEndpoint.put(
  'modifyClub',
  '/api/v1/clubs/admin',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: ModifyClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
    ]),
    success: ModifyClubResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const GenerateClubInviteLinkForAdminEndpoint = HttpApiEndpoint.put(
  'generateClubInviteLinkForAdmin',
  '/api/v1/clubs/admin/generate-admin-link',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: GenerateInviteLinkForAdminRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
    ]),
    success: GenerateInviteLinkForAdminResponse,
  }
).annotate(MaxExpectedDailyCall, 10000)

export const ListClubsEndpoint = HttpApiEndpoint.get(
  'listClubs',
  '/api/v1/clubs/admin',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
    ]),
    success: ListClubsResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const GetClubStatsEndpoint = HttpApiEndpoint.get(
  'getClubStats',
  '/api/v1/clubs/admin/stats',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    query: GetClubStatsRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
    ]),
    success: GetClubStatsResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const ReactivateClubEndpoint = HttpApiEndpoint.put(
  'reactivateClub',
  '/api/v1/clubs/admin/reactivate',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: ReactivateClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
      ClubCannotBeReactivatedError.pipe(HttpApiSchema.status(400)),
    ]),
    success: ReactivateClubResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const RequestClubImageUploadEndpoint = HttpApiEndpoint.post(
  'requestClubImageUpload',
  '/api/v1/clubs/admin/request-image-upload',
  {
    disableCodecs: true,
    headers: AdminTokenHeaders,
    payload: RequestClubImageUploadRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidAdminTokenError.pipe(HttpApiSchema.status(401)),
      S3ServiceError.pipe(HttpApiSchema.status(502)),
    ]),
    success: RequestClubImageUploadResponse,
  }
).annotate(MaxExpectedDailyCall, 1000)

export const GetClubInfoEndpoint = HttpApiEndpoint.post(
  'getClubInfo',
  '/api/v1/clubs/member/get-info',
  {
    disableCodecs: true,
    payload: GetClubInfoRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: GetClubInfoResponse,
  }
).annotate(MaxExpectedDailyCall, 500)

export const JoinClubEndpoint = HttpApiEndpoint.post(
  'joinClub',
  '/api/v1/clubs/member/join-club',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: JoinClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      MemberAlreadyInClubError.pipe(HttpApiSchema.status(400)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      ClubUserLimitExceededError.pipe(HttpApiSchema.status(429)),
    ]),
    success: JoinClubResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const LeaveClubEndpoint = HttpApiEndpoint.post(
  'leaveClub',
  '/api/v1/clubs/member/leave-club',
  {
    disableCodecs: true,
    payload: LeaveClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const GenerateClubJoinLinkEndpoint = HttpApiEndpoint.post(
  'generateClubJoinLink',
  '/api/v1/clubs/moderator/generate-join-link',
  {
    disableCodecs: true,
    payload: GenerateClubJoinLinkRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      UserIsNotModeratorError.pipe(HttpApiSchema.status(403)),
    ]),
    success: GenerateClubJoinLinkResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const DeactivateClubJoinLinkEndpoint = HttpApiEndpoint.delete(
  'deactivateClubJoinLink',
  '/api/v1/clubs/moderator/deactivate-join-link',
  {
    disableCodecs: true,
    payload: DeactivateClubJoinLinkRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InviteCodeNotFoundError.pipe(HttpApiSchema.status(400)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      UserIsNotModeratorError.pipe(HttpApiSchema.status(403)),
    ]),
    success: DeactivateClubJoinLinkResponse,
  }
).annotate(MaxExpectedDailyCall, 10)

export const AddUserToTheClubEndpint = HttpApiEndpoint.post(
  'addUserToTheClub',
  '/api/v1/clubs/moderator/add-user-to-club',
  {
    disableCodecs: true,
    payload: AddUserToTheClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      MemberAlreadyInClubError.pipe(HttpApiSchema.status(400)),
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      UserIsNotModeratorError.pipe(HttpApiSchema.status(403)),
      ClubUserLimitExceededError.pipe(HttpApiSchema.status(429)),
    ]),
    success: AddUserToTheClubResponse,
  }
).annotate(MaxExpectedDailyCall, 1000)

export const ListClubLinksEndpoint = HttpApiEndpoint.post(
  'listClubLinks',
  '/api/v1/clubs/moderator/list-links',
  {
    disableCodecs: true,
    payload: ListClubLinksRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      UserIsNotModeratorError.pipe(HttpApiSchema.status(403)),
    ]),
    success: ListClubLinksResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const SetPublicKeyV2Endpoint = HttpApiEndpoint.put(
  'setPublicKeyV2',
  '/api/v1/clubs/member/set-public-key-v2',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: SetPublicKeyV2Request,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      PublicKeyV2MissingError.pipe(HttpApiSchema.status(400)),
      KeyAlreadySetError.pipe(HttpApiSchema.status(400)),
    ]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 1000)

export const GetClubContactsEndpoint = HttpApiEndpoint.post(
  'getClubContacts',
  '/api/v1/clubs/member/get-contacts',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: GetClubContactsRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: GetClubContactsResponse,
  }
).annotate(MaxExpectedDailyCall, 500)

export const GetClubInfoByAccessCodeEndpoint = HttpApiEndpoint.post(
  'getClubInfoByAccessCode',
  '/api/v1/clubs/member/get-info-by-access-code',
  {
    disableCodecs: true,
    payload: GetClubInfoByAccessCodeRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
    ]),
    success: GetClubInfoByAccessCodeResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const ReportClubEndpoint = HttpApiEndpoint.post(
  'reportClub',
  '/api/v1/clubs/member/report-club',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: ReportClubRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidChallengeError.pipe(HttpApiSchema.status(401)),
      ReportClubLimitReachedError.pipe(HttpApiSchema.status(429)),
    ]),
    success: ReportClubResponse,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 10)

const UserApiGroup = HttpApiGroup.make('User')
  .add(CheckUserExistsEndpoint)
  .add(CreateUserEndpoint)
  .add(RefreshUserEndpoint)
  .add(UpdateNotificationTokenEndpoint)
  .add(DeleteUserEndpoint)
  .add(EraseUserFromNetworkEndpoint)

const ContactApiGroup = HttpApiGroup.make('Contact')
  .add(ImportContactsEndpoint)
  .add(ConvertPhoneNumberHashesToServerHashesEndpoint)
  .add(FetchMyContactsPaginatedEndpoint)
  .add(FetchCommonConnectionsPaginatedEndpoint)

const ClubsAdminApiGroup = HttpApiGroup.make('ClubsAdmin')
  .add(CreateClubEndpoint)
  .add(ModfiyClubEndpoint)
  .add(GenerateClubInviteLinkForAdminEndpoint)
  .add(ListClubsEndpoint)
  .add(GetClubStatsEndpoint)
  .add(ReactivateClubEndpoint)
  .add(RequestClubImageUploadEndpoint)

const ClubsMemberApiGroup = HttpApiGroup.make('ClubsMember')
  .add(GetClubInfoEndpoint)
  .add(JoinClubEndpoint)
  .add(LeaveClubEndpoint)
  .add(GetClubContactsEndpoint)
  .add(GetClubInfoByAccessCodeEndpoint)
  .add(ReportClubEndpoint)
  .add(SetPublicKeyV2Endpoint)

const ClubsModeratorApiGroup = HttpApiGroup.make('ClubsModerator')
  .add(GenerateClubJoinLinkEndpoint)
  .add(DeactivateClubJoinLinkEndpoint)
  .add(AddUserToTheClubEndpint)
  .add(ListClubLinksEndpoint)

export const ContactApiSpecification = HttpApi.make('Contact API')
  .add(UserApiGroup)
  .add(ContactApiGroup)
  .add(ClubsAdminApiGroup)
  .add(ClubsMemberApiGroup)
  .add(ClubsModeratorApiGroup)
  .add(ChallengeApiGroup)
  .middleware(RateLimitingMiddleware)
