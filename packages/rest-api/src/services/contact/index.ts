import {type CreateAxiosDefaults} from 'axios'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCall,
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  FetchCommonConnectionsResponse,
  FetchMyContactsResponse,
  ImportContactsResponse,
  UserExistsResponse,
  type CreateUserRequest,
  type FetchCommonConnectionsRequest,
  type FetchMyContactsRequest,
  type ImportContactsRequest,
  type RefreshUserRequest,
  type UpdateFirebaseTokenRequest,
  type UserNotFoundError,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  return {
    checkUserExists: () => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          'url': '/users/check-exists',
        },
        UserExistsResponse
      )
    },
    createUser: (request: CreateUserRequest) => {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: '/users',
        data: request,
      })
    },
    refreshUser: (request: RefreshUserRequest) => {
      return pipe(
        axiosCall(axiosInstance, {
          method: 'post',
          url: '/users/refresh',
          data: request,
        }),
        TE.mapLeft((e): typeof e | UserNotFoundError => {
          if (
            e._tag === 'BadStatusCodeError' &&
            e.response.data.code === '100101'
          ) {
            return {_tag: 'UserNotFoundError'}
          }
          return e
        })
      )
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
