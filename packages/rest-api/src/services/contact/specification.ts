import {ChallengeApiGroup} from '@vexl-next/server-utils/src/services/challenge/specification'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  AddUserToTheClubErrors,
  AddUserToTheClubRequest,
  AddUserToTheClubResponse,
  AdminTokenParams,
  CheckUserExistsRequest,
  CreateClubErrors,
  CreateClubRequest,
  CreateClubResponse,
  CreateUserRequest,
  DeactivateClubJoinLinkErrors,
  DeactivateClubJoinLinkRequest,
  DeactivateClubJoinLinkResponse,
  FetchCommonConnectionsRequest,
  FetchCommonConnectionsResponseE,
  FetchMyContactsRequest,
  FetchMyContactsResponseE,
  GenerateClubJoinLinkErrors,
  GenerateClubJoinLinkRequest,
  GenerateClubJoinLinkResponse,
  GenerateInviteLinkForAdminErrors,
  GenerateInviteLinkForAdminRequest,
  GenerateInviteLinkForAdminResponse,
  GetClubContactsErrors,
  GetClubContactsRequest,
  GetClubContactsResponse,
  GetClubInfoByAccessCodeErrors,
  GetClubInfoByAccessCodeRequest,
  GetClubInfoByAccessCodeResponse,
  GetClubInfoErrors,
  GetClubInfoRequest,
  GetClubInfoResponse,
  ImportContactsErrors,
  ImportContactsRequest,
  ImportContactsResponse,
  JoinClubErrors,
  JoinClubRequest,
  JoinClubResponse,
  LeaveClubErrors,
  LeaveClubRequest,
  ListClubLinksErrors,
  ListClubLinksRequest,
  ListClubLinksResponse,
  ListClubsErrors,
  ListClubsResponse,
  ModifyClubErrors,
  ModifyClubRequest,
  ModifyClubResponse,
  RefreshUserRequest,
  ReportClubErrors,
  ReportClubRequest,
  ReportClubResponse,
  SendBulkNotificationRequest,
  SendBulkNotificationResponse,
  SendBulkNotificationsErrors,
  UpdateBadOwnerHashErrors,
  UpdateBadOwnerHashRequest,
  UpdateBadOwnerHashResponse,
  UpdateFirebaseTokenRequest,
  UpdateNotificationTokenRequest,
  UserExistsResponse,
  UserNotFoundError,
} from './contracts'

export const CheckUserExistsEndpoint = Api.post(
  'checkUserExists',
  '/api/v1/users/check-exists'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(CheckUserExistsRequest),
  Api.setResponseBody(UserExistsResponse)
)

export const CreateUserEndpoint = Api.post('createUser', '/api/v1/users').pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestBody(CreateUserRequest),
  Api.setResponse({
    status: 201,
    body: NoContentResponse,
  })
)

export const RefreshUserEndpoint = Api.post(
  'refreshUser',
  '/api/v1/users/refresh'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
  Api.setResponseBody(NoContentResponse),
  Api.setRequestBody(RefreshUserRequest),
  Api.addResponse({
    status: 404,
    body: UserNotFoundError,
  })
)
export const UpdateFirebaseTokenEndpoint = Api.put(
  'updateFirebaseToken',
  '/api/v1/users'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestBody(UpdateFirebaseTokenRequest),
  Api.setResponse({
    status: 200,
    body: NoContentResponse,
  })
)

export const UpdateNotificationTokenEndpoint = Api.put(
  'updateNotificationToken',
  '/api/v1/users/notification-token'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestBody(UpdateNotificationTokenRequest),
  Api.setResponse({
    status: 200,
    body: NoContentResponse,
  })
)

export const DeleteUserEndpoint = Api.delete(
  'deleteUser',
  '/api/v1/users/me'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponse({
    status: 200,
    body: NoContentResponse,
  })
)

export const ImportContactsEndpoint = Api.post(
  'importContacts',
  '/api/v1/contacts/import/replace'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(ImportContactsRequest),
  Api.setResponse({
    status: 200,
    body: ImportContactsResponse,
  }),
  Api.addResponse({
    status: 400,
    body: ImportContactsErrors,
  })
)

export const FetchMyContactsEndpoint = Api.get(
  'fetchMyContacts',
  '/api/v1/contacts/me'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(FetchMyContactsRequest),
  Api.setResponseBody(FetchMyContactsResponseE)
)

export const FetchCommonConnectionsEndpoint = Api.post(
  'fetchCommonConnections',
  '/api/v1/contacts/common'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(FetchCommonConnectionsRequest),
  Api.setResponseBody(FetchCommonConnectionsResponseE)
)

export const UpdateBadOwnerHashEndpoint = Api.post(
  'updateBadOwnerHash',
  '/api/v1/update-bad-owner-hash'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(UpdateBadOwnerHashRequest),
  Api.setResponseBody(UpdateBadOwnerHashResponse),
  Api.addResponse({
    status: 400,
    body: UpdateBadOwnerHashErrors,
  })
)

export const CreateClubEndpoint = Api.post(
  'createClub',
  '/api/v1/clubs/admin'
).pipe(
  Api.setRequestQuery(AdminTokenParams),
  Api.setRequestBody(CreateClubRequest),
  Api.setResponseBody(CreateClubResponse),
  Api.addResponse({
    status: 400,
    body: CreateClubErrors,
  })
)

export const ModfiyClubEndpoint = Api.put(
  'modifyClub',
  '/api/v1/clubs/admin'
).pipe(
  Api.setRequestQuery(AdminTokenParams),
  Api.setRequestBody(ModifyClubRequest),
  Api.setResponseBody(ModifyClubResponse),
  Api.addResponse({
    status: 400,
    body: ModifyClubErrors,
  })
)

export const GenerateClubInviteLinkForAdminEndpoint = Api.put(
  'generateClubInviteLinkForAdmin',
  '/api/v1/clubs/admin/generate-admin-link'
).pipe(
  Api.setRequestQuery(AdminTokenParams),
  Api.setRequestBody(GenerateInviteLinkForAdminRequest),
  Api.setResponseBody(GenerateInviteLinkForAdminResponse),
  Api.addResponse({
    status: 400,
    body: GenerateInviteLinkForAdminErrors,
  })
)

export const ListClubsEndpoint = Api.get(
  'listClubs',
  '/api/v1/clubs/admin'
).pipe(
  Api.setRequestQuery(AdminTokenParams),
  Api.setResponseBody(ListClubsResponse),
  Api.addResponse({
    status: 400,
    body: ListClubsErrors,
  })
)

export const GetClubInfoEndpoint = Api.post(
  'getClubInfo',
  '/api/v1/clubs/member/get-info'
).pipe(
  Api.setRequestBody(GetClubInfoRequest),
  Api.setResponseBody(GetClubInfoResponse),
  Api.addResponse({
    status: 400,
    body: GetClubInfoErrors,
  })
)

export const JoinClubEndpoint = Api.post(
  'joinClub',
  '/api/v1/clubs/member/join-club'
).pipe(
  Api.setRequestBody(JoinClubRequest),
  Api.setResponseBody(JoinClubResponse),
  Api.addResponse({
    status: 400,
    body: JoinClubErrors,
  })
)

export const LeaveClubEndpoint = Api.post(
  'leaveClub',
  '/api/v1/clubs/member/leave-club'
).pipe(
  Api.setRequestBody(LeaveClubRequest),
  Api.setResponseBody(NoContentResponse),
  Api.addResponse({
    status: 400,
    body: LeaveClubErrors,
  })
)

export const GenerateClubJoinLinkEndpoint = Api.post(
  'generateClubJoinLink',
  '/api/v1/clubs/moderator/generate-join-link'
).pipe(
  Api.setRequestBody(GenerateClubJoinLinkRequest),
  Api.setResponseBody(GenerateClubJoinLinkResponse),
  Api.addResponse({
    status: 400,
    body: GenerateClubJoinLinkErrors,
  })
)

export const DeactivateClubJoinLinkEndpoint = Api.delete(
  'deactivateClubJoinLink',
  '/api/v1/clubs/moderator/deactivate-join-link'
).pipe(
  Api.setRequestBody(DeactivateClubJoinLinkRequest),
  Api.setResponseBody(DeactivateClubJoinLinkResponse),
  Api.addResponse({
    status: 400,
    body: DeactivateClubJoinLinkErrors,
  })
)

export const AddUserToTheClubEndpint = Api.post(
  'addUserToTheClub',
  '/api/v1/clubs/moderator/add-user-to-club'
).pipe(
  Api.setRequestBody(AddUserToTheClubRequest),
  Api.setResponseBody(AddUserToTheClubResponse),
  Api.addResponse({
    status: 400,
    body: AddUserToTheClubErrors,
  })
)

export const ListClubLinksEndpoint = Api.post(
  'listClubLinks',
  '/api/v1/clubs/moderator/list-links'
).pipe(
  Api.setRequestBody(ListClubLinksRequest),
  Api.setResponseBody(ListClubLinksResponse),
  Api.addResponse({
    status: 400,
    body: ListClubLinksErrors,
  })
)

export const GetClubContactsEndpoint = Api.post(
  'getClubContacts',
  '/api/v1/clubs/member/get-contacts'
).pipe(
  Api.setRequestBody(GetClubContactsRequest),
  Api.setResponseBody(GetClubContactsResponse),
  Api.addResponse({
    status: 400,
    body: GetClubContactsErrors,
  })
)

export const GetClubInfoByAccessCodeEndpoint = Api.post(
  'getClubInfoByAccessCode',
  '/api/v1/clubs/member/get-info-by-access-code'
).pipe(
  Api.setRequestBody(GetClubInfoByAccessCodeRequest),
  Api.setResponseBody(GetClubInfoByAccessCodeResponse),
  Api.addResponse({
    status: 400,
    body: GetClubInfoByAccessCodeErrors,
  })
)

export const ReportClubEndpoint = Api.post(
  'reportClub',
  '/api/v1/clubs/member/report-club'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(ReportClubRequest),
  Api.setResponseBody(ReportClubResponse),
  Api.addResponse({
    status: 400,
    body: ReportClubErrors,
  })
)

export const SendBulkNotificationEndpoint = Api.post(
  'sendBulkNotification',
  '/api/v1/notifications/bulk'
).pipe(
  Api.setRequestQuery(AdminTokenParams),
  Api.setRequestBody(SendBulkNotificationRequest),
  Api.setResponseBody(SendBulkNotificationResponse),
  Api.addResponse({
    status: 500,
    body: SendBulkNotificationsErrors,
  })
)

const UserApiGroup = ApiGroup.make('User').pipe(
  ApiGroup.addEndpoint(CheckUserExistsEndpoint),
  ApiGroup.addEndpoint(CreateUserEndpoint),
  ApiGroup.addEndpoint(RefreshUserEndpoint),
  ApiGroup.addEndpoint(UpdateFirebaseTokenEndpoint),
  ApiGroup.addEndpoint(UpdateNotificationTokenEndpoint),
  ApiGroup.addEndpoint(DeleteUserEndpoint),
  ApiGroup.addEndpoint(UpdateBadOwnerHashEndpoint)
)

const ContactApiGroup = ApiGroup.make('Contact').pipe(
  ApiGroup.addEndpoint(ImportContactsEndpoint),
  ApiGroup.addEndpoint(FetchMyContactsEndpoint),
  ApiGroup.addEndpoint(FetchCommonConnectionsEndpoint)
)

const ClubsAdminApiGroup = ApiGroup.make('ClubsAdmin', {
  description: 'Clubs managment for admins',
}).pipe(
  ApiGroup.addEndpoint(CreateClubEndpoint),
  ApiGroup.addEndpoint(ModfiyClubEndpoint),
  ApiGroup.addEndpoint(GenerateClubInviteLinkForAdminEndpoint),
  ApiGroup.addEndpoint(ListClubsEndpoint)
)

const ClubsMemberApiGroup = ApiGroup.make('ClubsMember', {
  description: 'Clubs managment for members',
}).pipe(
  ApiGroup.addEndpoint(GetClubInfoEndpoint),
  ApiGroup.addEndpoint(JoinClubEndpoint),
  ApiGroup.addEndpoint(LeaveClubEndpoint),
  ApiGroup.addEndpoint(GetClubContactsEndpoint),
  ApiGroup.addEndpoint(GetClubInfoByAccessCodeEndpoint),
  ApiGroup.addEndpoint(ReportClubEndpoint)
)

const ClubsModeratorApiGroup = ApiGroup.make('ClubsModerator', {
  description: 'Clubs managment for moderators',
}).pipe(
  ApiGroup.addEndpoint(GenerateClubJoinLinkEndpoint),
  ApiGroup.addEndpoint(DeactivateClubJoinLinkEndpoint),
  ApiGroup.addEndpoint(AddUserToTheClubEndpint),
  ApiGroup.addEndpoint(ListClubLinksEndpoint)
)

const AdminApi = ApiGroup.make('Admin').pipe(
  ApiGroup.addEndpoint(SendBulkNotificationEndpoint)
)

export const ContactApiSpecification = Api.make({
  title: 'Contact service',
  version: '1.0.0',
}).pipe(
  Api.addGroup(UserApiGroup),
  Api.addGroup(ContactApiGroup),
  Api.addGroup(ClubsAdminApiGroup),
  Api.addGroup(ClubsMemberApiGroup),
  Api.addGroup(ChallengeApiGroup),
  Api.addGroup(ClubsModeratorApiGroup),
  Api.addGroup(AdminApi)
)
