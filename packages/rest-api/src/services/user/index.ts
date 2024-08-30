import {Schema} from '@effect/schema'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CreateAxiosDefaults} from 'axios'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {handleCommonErrorsEffect, type LoggingFunction} from '../../utils'
import {UserApiSpecification} from './specification'

import {type SubmitFeedbackInput} from '../feedback/contracts'
import {
  InitVerificationErrors,
  VerifyChallengeErrors,
  VerifyCodeErrors,
  type InitVerificationInput,
  type VerifyChallengeInput,
  type VerifyPhoneNumberInput,
} from './contracts'

export interface UserApiProps {
  url: ServiceUrl
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
  getUserSessionCredentials?: GetUserSessionCredentials
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  url,
  platform,
  clientVersion,
  clientSemver,
  getUserSessionCredentials,
}: UserApiProps) {
  const client = createClientInstanceWithAuth({
    api: UserApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url: ServiceUrl.parse(urlJoin(url, '/api/v1')),
  })

  return {
    initPhoneVerification: (initVerificationInput: InitVerificationInput) =>
      handleCommonErrorsEffect(
        client.initVerification(initVerificationInput),
        InitVerificationErrors
      ),
    verifyPhoneNumber: (verifyPhoneNumberInput: VerifyPhoneNumberInput) =>
      handleCommonErrorsEffect(
        client.verifyCode(verifyPhoneNumberInput),
        VerifyCodeErrors
      ),
    verifyChallenge: (verifyChallengeInput: VerifyChallengeInput) =>
      handleCommonErrorsEffect(
        client.verifyChallenge(verifyChallengeInput),
        VerifyChallengeErrors
      ),
    deleteUser: () =>
      handleCommonErrorsEffect(client.logoutUser({}), Schema.Undefined),
    submitFeedback: (submitFeedbackInput: SubmitFeedbackInput) =>
      handleCommonErrorsEffect(
        client.submitFeedback(submitFeedbackInput),
        Schema.Undefined
      ),
  }
}

export type UserApi = ReturnType<typeof api>
