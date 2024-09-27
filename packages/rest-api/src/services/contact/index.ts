import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CreateAxiosDefaults} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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
  ImportListEmptyError,
  UnableToVerifySignatureError,
  UpdateBadOwnerHashResponse,
  UserExistsResponse,
  UserNotFoundError,
  type CreateUserRequest,
  type FetchCommonConnectionsRequest,
  type FetchMyContactsRequest,
  type ImportContactsRequest,
  type RefreshUserRequest,
  type UpdateBadOwnerHashRequest,
  type UpdateFirebaseTokenRequest,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    clientSemver,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  return {
    checkUserExists: ({
      notifyExistingUserAboutLogin,
    }: {
      notifyExistingUserAboutLogin: boolean
    }) => {
      return axiosCallWithValidation(
        axiosInstance,
        {
          method: 'post',
          'url': '/users/check-exists',
          params: {notifyExistingUserAboutLogin},
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
            return new UserNotFoundError()
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
              return new ImportListEmptyError()
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
    updateBadOwnerHash: (request: UpdateBadOwnerHashRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/update-bad-owner-hash',
            data: request,
          },
          UpdateBadOwnerHashResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data._tag === 'UnableToVerifySignatureError')
              return new UnableToVerifySignatureError()
          }
          return e
        })
      )
    },
  }
}

export type ContactPrivateApi = ReturnType<typeof privateApi>
