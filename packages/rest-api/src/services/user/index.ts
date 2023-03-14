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
import {axiosCallWithValidation, createAxiosInstance} from '../../utils'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type PlatformName} from '../../PlatformName'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function publicApi({
  url,
  platform,
  axiosConfig,
}: {
  url: ServiceUrl
  platform: PlatformName
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
}) {
  const axiosInstance = createAxiosInstance(platform, {
    ...axiosConfig,
    baseURL: urlJoin(url, '/api/v1'),
  })

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

// deleteUser: async function deleteUser(): AxiosPromise<void> {
//   return await axiosInstance.delete('/user/me', {
//     headers: getCredentialsHeaders(),
//   })
// }
// export async function exportData(): AxiosPromise<ExportDataResponse> {
//   return authAxiosInstance.get('/export/me', {
//     headers: getCredentialsHeaders(),
//   })
// }
