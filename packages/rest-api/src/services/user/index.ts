import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'

import {Effect, Option} from 'effect/index'
import {makeRequestWithCommonAndSecurityHeaders} from '../../apiSecurity'
import {createClientInstance} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {
  type InitEraseUserRequest,
  type InitPhoneVerificationRequest,
  type InitUpgradeAuthRequest,
  type SubmitUpgradeAuthRequest,
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
  getUserSessionCredentials: GetUserSessionCredentials
  prefix?: CountryPrefix
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
  prefix,
}: UserApiProps) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: UserApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        url,
        isDeveloper,
        language,
        appSource,
        loggingFunction,
        deviceModel,
        osVersion,
        prefix,
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
      prefix: Option.fromNullable(prefix),
    })

    // Security headers are built lazily inside each request effect (not once
    // at api construction) so every authenticated request reads the current
    // session credentials and a failing credentials read can never throw
    // synchronously out of the code constructing the request.
    const withSecurityHeaders = makeRequestWithCommonAndSecurityHeaders(
      getUserSessionCredentials,
      commonHeaders
    )

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
      deleteUser: () =>
        withSecurityHeaders((headers) => client.logoutUser({headers})),
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
      initUpgradeAuth: (request: InitUpgradeAuthRequest) =>
        withSecurityHeaders((headers) =>
          client.UpgradeAuth.initUpgradeAuth({payload: request, headers})
        ),
      submitUpgradeAuth: (request: SubmitUpgradeAuthRequest) =>
        withSecurityHeaders((headers) =>
          client.UpgradeAuth.submitUpgradeAuth({payload: request, headers})
        ),
    }
  })
}

export type UserApi = Effect.Effect.Success<ReturnType<typeof api>>
