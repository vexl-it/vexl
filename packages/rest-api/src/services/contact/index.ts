import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type CreateAxiosDefaults} from 'axios'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import urlJoin from 'url-join'
import {
  axiosCall,
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {type PlatformName} from '../../PlatformName'
import {
  type CreateUserRequest,
  type FetchCommonConnectionsRequest,
  FetchCommonConnectionsResponse,
  type FetchMyContactsRequest,
  FetchMyContactsResponse,
  type ImportContactsRequest,
  ImportContactsResponse,
  type RefreshUserRequest,
  type UpdateFirebaseTokenRequest,
} from './contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  return {
    createUser: (request: CreateUserRequest) => {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: '/users',
        data: request,
      })
    },
    refreshUser: (request: RefreshUserRequest) => {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: '/users/refresh',
        data: request,
      })
    },
    updateFirebaseToken: (request: UpdateFirebaseTokenRequest) => {
      return axiosCall(axiosInstance, {
        method: 'put',
        url: '/users',
        data: request,
      })
    },
    deleteUser: () => {
      return axiosCall(axiosInstance, {
        method: 'delete',
        url: '/users/me',
      })
    },
    importContacts: (request: ImportContactsRequest) => {
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
    fetchMyContacts: (request: FetchMyContactsRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'get',
            url: '/contacts/me',
            params: {
              level: request.level,
              page: request.page,
              limit: request.limit,
            },
          },
          FetchMyContactsResponse
        )
      )
    },
    fetchCommonConnections: (request: FetchCommonConnectionsRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/contacts/common',
            data: request,
          },
          FetchCommonConnectionsResponse
        )
      )
    },
  }
}

export type ContactPrivateApi = ReturnType<typeof privateApi>
