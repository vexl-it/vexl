import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type CreateAxiosDefaults} from 'axios'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import urlJoin from 'url-join'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuth,
  axiosCall,
} from '../../utils'
import {type PlatformName} from '../../PlatformName'
import {
  type CreateUserRequest,
  type RefreshUserRequest,
  type UpdateFirebaseTokenRequest,
  type ImportContactsRequest,
  ImportContactsResponse,
} from './contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  url,
  getUserSessionCredentials,
  axiosConfig,
}: {
  platform: PlatformName
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
}) {
  const axiosInstance = createAxiosInstanceWithAuth(
    getUserSessionCredentials,
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    }
  )

  return {
    createUser: function createUser(request: CreateUserRequest) {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: '/users',
        data: request,
      })
    },
    refreshUser: function refreshUser(request: RefreshUserRequest) {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: '/users/refresh',
        data: request,
      })
    },
    updateFirebaseToken: function updateFirebaseToken(
      request: UpdateFirebaseTokenRequest
    ) {
      return axiosCall(axiosInstance, {
        method: 'put',
        url: '/users',
        data: request,
      })
    },
    deleteUser: function deleteUser() {
      return axiosCall(axiosInstance, {
        method: 'delete',
        url: '/users/me',
      })
    },
    importContacts: function importContacts(request: ImportContactsRequest) {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/contacts/import/replace',
            data: request,
          },
          ImportContactsResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '101102')
              return {_tag: 'ImportListEmpty'} as const
          }
          return e
        })
      )
    },
  }
}
