import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'

import {Effect, Option} from 'effect/index'
import {createClientInstanceWithAuth} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {
  type InitEraseUserRequest,
  type InitPhoneVerificationRequest,
  type RegenerateSessionCredentialsRequest,
  type VerifyAndEraseUserRequest,
  type VerifyChallengeRequest,
  type VerifyPhoneNumberRequest,
} from './contracts'
import {UserApiSpecification} from './specification'

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
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstanceWithAuth({
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
    )

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
      generateLoginChallenge: () => client.generateLoginChallenge({}),
      initPhoneVerification: (body: InitPhoneVerificationRequest) =>
        client.Login.initVerification({
          payload: body,
          headers: commonHeaders,
        }),
      verifyPhoneNumber: (body: VerifyPhoneNumberRequest) =>
        client.Login.verifyCode({payload: body}),
      verifyChallenge: (body: VerifyChallengeRequest) =>
        client.Login.verifyChallenge({payload: body}),
      deleteUser: () => client.logoutUser({}),
      regenerateSessionCredentials: (
        body: RegenerateSessionCredentialsRequest
      ) => client.regenerateSessionCredentials({payload: body}),
      getVersionServiceInfo: () =>
        client.getVersionServiceInfo({
          headers: commonHeaders,
        }),
      initEraseUser: (request: InitEraseUserRequest) =>
        client.EraseUser.initEraseUser({
          headers: commonHeaders,
          payload: request,
        }),
      verifyAndEraseUser: (request: VerifyAndEraseUserRequest) =>
        client.EraseUser.verifyAndEraseuser({
          payload: request,
        }),
    }
  })
}

export type UserApi = Effect.Effect.Success<ReturnType<typeof api>>
