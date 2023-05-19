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
  type UserNotFoundError,
} from './contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {
  createUser,
  deleteUser,
  replaceContacts,
  refreshUser,
  updateFirebaseToken,
  fetchMyContacts,
  fetchCommonConnections,
} from './routes'

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
    },
    loggingFunction
  )

  return {
    createUser: (request: CreateUserRequest) => {
      return axiosCall(axiosInstance, {
        method: 'post',
        url: createUser,
        data: request,
      })
    },
    refreshUser: (request: RefreshUserRequest) => {
      return pipe(
        axiosCall(axiosInstance, {
          method: 'post',
          url: refreshUser,
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
        url: updateFirebaseToken,
        data: request,
      })
    },
    deleteUser: () => {
      return axiosCall(axiosInstance, {
        method: 'delete',
        url: deleteUser,
      })
    },
    importContacts: (request: ImportContactsRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: replaceContacts,
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
            url: fetchMyContacts,
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
            url: fetchCommonConnections,
            data: request,
          },
          FetchCommonConnectionsResponse
        )
      )
    },
  }
}

export type ContactPrivateApi = ReturnType<typeof privateApi>
