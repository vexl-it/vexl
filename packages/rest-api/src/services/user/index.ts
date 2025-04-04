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

import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type SubmitFeedbackInput} from '../feedback/contracts'
import {
  InitVerificationErrors,
  VerifyChallengeErrors,
  VerifyCodeErrors,
  type InitVerificationInput,
  type RegenerateSessionCredentialsRequest,
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
  })

  const commonHeaders = makeCommonHeaders({
    appSource,
    versionCode: clientVersion,
    semver: clientSemver,
    platform,
    isDeveloper,
    language,
  })

  return {
    initPhoneVerification: (initVerificationInput: InitVerificationInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.initVerification(initVerificationInput),
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
  }
}

export type UserApi = ReturnType<typeof api>
