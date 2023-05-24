import {type CreateAxiosDefaults} from 'axios'
import urlJoin from 'url-join'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {
  type ChallengeCouldNotBeGenerated,
  type InitPhoneNumberVerificationRequest,
  InitPhoneNumberVerificationResponse,
  type InvalidPhoneNumber,
  type PreviousCodeNotExpired,
  type PublicKeyOrHashInvalid,
  type SignatureCouldNotBeGenerated,
  type UserAlreadyExists,
  type UserNotFound,
  type VerificationNotFound,
  type VerifyChallengeRequest,
  VerifyChallengeResponse,
  type VerifyPhoneNumberRequest,
  VerifyPhoneNumberResponse,
} from './contracts'
import {
  axiosCall,
  axiosCallWithValidation,
  createAxiosInstance,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type PlatformName} from '../../PlatformName'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function publicApi({
  url,
  platform,
  axiosConfig,
  loggingFunction,
}: {
  url: ServiceUrl
  platform: PlatformName
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstance(
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  return {
    initPhoneVerification: (request: InitPhoneNumberVerificationRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/user/confirmation/phone',
            data: request,
          },
          InitPhoneNumberVerificationResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100110')
              return {_tag: 'InvalidPhoneNumber'} as InvalidPhoneNumber
            if (e.response.data.code === '100111')
              return {_tag: 'PreviousCodeNotExpired'} as PreviousCodeNotExpired
          }
          return e
        })
      )
    },

    verifyPhoneNumber: (request: VerifyPhoneNumberRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/user/confirmation/code',
            data: request,
          },
          VerifyPhoneNumberResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101')
              return {_tag: 'UserAlreadyExists'} as UserAlreadyExists
            if (e.response.data.code === '100106')
              return {
                _tag: 'ChallengeCouldNotBeGenerated',
              } as ChallengeCouldNotBeGenerated
            if (e.response.data.code === '100104')
              return {_tag: 'VerificationNotFound'} as VerificationNotFound
          }
          return e
        })
      )
    },

    verifyChallenge: (request: VerifyChallengeRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/user/confirmation/challenge',
            data: request,
          },
          VerifyChallengeResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100103')
              return {_tag: 'UserNotFound'} as UserNotFound
            if (e.response.data.code === '100105')
              return {
                _tag: 'SignatureCouldNotBeGenerated',
              } as SignatureCouldNotBeGenerated
            if (e.response.data.code === '100108')
              return {_tag: 'PublicKeyOrHashInvalid'} as PublicKeyOrHashInvalid
            if (e.response.data.code === '100104')
              return {_tag: 'VerificationNotFound'} as VerificationNotFound
          }
          return e
        })
      )
    },
  }
}

export type UserPublicApi = ReturnType<typeof publicApi>

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
    deleteUser: () =>
      axiosCall(axiosInstance, {method: 'delete', url: '/user/me'}),
  }
}

export type UserPrivateApi = ReturnType<typeof privateApi>

// export async function exportData(): AxiosPromise<ExportDataResponse> {
//   return authAxiosInstance.get('/export/me', {
//     headers: getCredentialsHeaders(),
//   })
// }
