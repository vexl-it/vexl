import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {
  CheckUserExistsRequest,
  CreateUserRequest,
  FetchCommonConnectionsRequest,
  FetchCommonConnectionsResponseE,
  FetchMyContactsRequest,
  FetchMyContactsResponseE,
  ImportContactsRequest,
  ImportContactsResponse,
  ImportListEmptyError,
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
  })
)

export const RefreshUserEndpoint = Api.post(
  'refreshUser',
  '/api/v1/users/refresh'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
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
  })
)

export const DeleteUserEndpoint = Api.delete(
  'deleteUser',
  '/api/v1/users/me'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponse({
    status: 200,
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
    body: ImportListEmptyError,
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

export const ContactApiSpecification = Api.make({
  title: 'Contact service',
  version: '1.0.0',
}).pipe(Api.addGroup(UserApiGroup), Api.addGroup(ContactApiGroup))
