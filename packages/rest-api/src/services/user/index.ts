import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  RegenerateSessionCredentialsErrors,
  UserApiSpecification,
} from './specification'

import {Option} from 'effect/index'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type SubmitFeedbackInput} from '../feedback/contracts'
import {
  InitVerificationErrors,
  VerifyAndEraseUserErrors,
  VerifyChallengeErrors,
  VerifyCodeErrors,
  type InitEraseUserRequest,
  type InitVerificationInput,
  type RegenerateSessionCredentialsRequest,
  type VerifyAndEraseUserRequest,
  type VerifyChallengeInput,
  type VerifyPhoneNumberInput,
} from './contracts'

export interface UserApiProps {
  url: ServiceUrl
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  language: string
  isDeveloper: boolean
  appSource: AppSource
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
  getUserSessionCredentials?: GetUserSessionCredentials
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  url,
  platform,
  clientVersion,
  clientSemver,
  language,
  isDeveloper,
  appSource,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
}: UserApiProps) {
  const client = createClientInstanceWithAuth({
    api: UserApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
    isDeveloper,
    language,
    appSource,
    loggingFunction,
    deviceModel,
    osVersion,
  })

  const commonHeaders = makeCommonHeaders({
    appSource,
    versionCode: clientVersion,
    semver: clientSemver,
    platform,
    isDeveloper,
    language,
    deviceModel: Option.fromNullable(deviceModel),
    osVersion: Option.fromNullable(osVersion),
  })

  return {
    initPhoneVerification: (initVerificationInput: InitVerificationInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.initVerification({
          ...initVerificationInput,
          headers: commonHeaders,
        }),
        InitVerificationErrors
      ),
    verifyPhoneNumber: (verifyPhoneNumberInput: VerifyPhoneNumberInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.verifyCode(verifyPhoneNumberInput),
        VerifyCodeErrors
      ),
    verifyChallenge: (verifyChallengeInput: VerifyChallengeInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.verifyChallenge(verifyChallengeInput),
        VerifyChallengeErrors
      ),
    deleteUser: () => handleCommonErrorsEffect(client.logoutUser({})),
    submitFeedback: (submitFeedbackInput: SubmitFeedbackInput) =>
      handleCommonErrorsEffect(client.submitFeedback(submitFeedbackInput)),
    regenerateSessionCredentials: (args: RegenerateSessionCredentialsRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.regenerateSessionCredentials({body: args}),
        RegenerateSessionCredentialsErrors
      ),
    getVersionServiceInfo: () =>
      handleCommonErrorsEffect(
        client.getVersionServiceInfo({
          headers: commonHeaders,
        })
      ),
    initEraseUser: (request: InitEraseUserRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.initEraseUser({
          headers: commonHeaders,
          body: request,
        }),
        InitVerificationErrors
      ),
    verifyAndEraseUser: (request: VerifyAndEraseUserRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.verifyAndEraseuser({
          body: request,
        }),
        VerifyAndEraseUserErrors
      ),
  }
}

export type UserApi = ReturnType<typeof api>
