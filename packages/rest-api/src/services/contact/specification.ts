import {Schema} from '@effect/schema'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {
  CheckUserExistsRequest,
  CreateUserRequestE,
  FetchCommonConnectionsRequestE,
  FetchCommonConnectionsResponseE,
  FetchMyContactsRequestE,
  FetchMyContactsResponseE,
  ImportContactsRequestE,
  ImportContactsResponseE,
  ImportListEmptyError,
  RefreshUserRequestE,
  UpdateFirebaseTokenRequestE,
  UserExistsResponseE,
  UserNotFoundError,
} from './contracts'

export const CheckUserExistsEndpoint = Api.post(
  'checkUserExists',
  '/api/v1/users/check-exists'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestQuery(CheckUserExistsRequest),
  Api.setResponseBody(UserExistsResponseE)
)

export const CreateUserEndpoint = Api.post('createUser', '/api/v1/users').pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestHeaders(CommonHeaders),
  Api.setRequestBody(CreateUserRequestE),
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
  Api.setRequestBody(RefreshUserRequestE),
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
  Api.setRequestBody(UpdateFirebaseTokenRequestE),
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

export const ImportContactsErrors = Schema.Union(ImportListEmptyError)
export const ImportContactsEndpoint = Api.post(
  'importContacts',
  '/api/v1/contacts/import/replace'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(ImportContactsRequestE),
  Api.setResponse({
    status: 200,
    body: ImportContactsResponseE,
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
  Api.setRequestQuery(FetchMyContactsRequestE),
  Api.setResponseBody(FetchMyContactsResponseE)
)

export const FetchCommonConnectionsEndpoint = Api.post(
  'fetchCommonConnections',
  '/api/v1/contacts/common'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setRequestBody(FetchCommonConnectionsRequestE),
  Api.setResponseBody(FetchCommonConnectionsResponseE)
)

const UserApiGroup = ApiGroup.make('User').pipe(
  ApiGroup.addEndpoint(CheckUserExistsEndpoint),
  ApiGroup.addEndpoint(CreateUserEndpoint),
  ApiGroup.addEndpoint(RefreshUserEndpoint),
  ApiGroup.addEndpoint(UpdateFirebaseTokenEndpoint),
  ApiGroup.addEndpoint(DeleteUserEndpoint)
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
