import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {
  AdminTokenParams,
  CheckUserExistsRequest,
  CreateClubErrors,
  CreateClubRequest,
  CreateClubResponse,
  CreateUserRequest,
  FetchCommonConnectionsRequest,
  FetchCommonConnectionsResponseE,
  FetchMyContactsRequest,
  FetchMyContactsResponseE,
  GenerateInviteLinkForAdminErrors,
  GenerateInviteLinkForAdminRequest,
  GenerateInviteLinkForAdminResponse,
  ImportContactsErrors,
  ImportContactsRequest,
  ImportContactsResponse,
  ListClubsErrors,
  ListClubsResponse,
  ModifyClubErrors,
  ModifyClubRequest,
  ModifyClubResponse,
  RefreshUserRequest,
  UpdateBadOwnerHashErrors,
  UpdateBadOwnerHashRequest,
  UpdateBadOwnerHashResponse,
  UpdateFirebaseTokenRequest,
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

const UserApiGroup = ApiGroup.make('User').pipe(
  ApiGroup.addEndpoint(CheckUserExistsEndpoint),
  ApiGroup.addEndpoint(CreateUserEndpoint),
  ApiGroup.addEndpoint(RefreshUserEndpoint),
  ApiGroup.addEndpoint(UpdateFirebaseTokenEndpoint),
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

export const ContactApiSpecification = Api.make({
  title: 'Contact service',
  version: '1.0.0',
}).pipe(
  Api.addGroup(UserApiGroup),
  Api.addGroup(ContactApiGroup),
  Api.addGroup(ClubsAdminApiGroup)
)
