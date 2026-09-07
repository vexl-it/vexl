import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Effect, Option} from 'effect'
import {createClientInstance} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {type ReportNotificationInteractionRequest} from './contracts'
import {MetricsApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  appSource,
  isDeveloper,
  getUserSessionCredentials,
  signal,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  language: string
  appSource: AppSource
  isDeveloper: boolean
  clientSemver: VersionString
  url: ServiceUrl
  deviceModel?: string
  osVersion?: string
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
  prefix?: CountryPrefix
}) {
  return Effect.gen(function* () {
    const client = yield* createClientInstance({
      api: MetricsApiSpecification,
      platform,
      clientVersion,
      language,
      isDeveloper,
      appSource,
      clientSemver,
      url,
      loggingFunction,
      deviceModel,
      osVersion,
      prefix,
    })

    const commonHeaders = makeCommonHeaders({
      appSource,
      versionCode: clientVersion,
      semver: clientSemver,
      platform,
      isDeveloper,
      language,
      deviceModel: Option.fromNullishOr(deviceModel),
      osVersion: Option.fromNullishOr(osVersion),
      prefix: Option.fromNullishOr(prefix),
    })

    return {
      reportNotificationInteraction: (
        request: ReportNotificationInteractionRequest
      ) =>
        client.reportNotificationInteraction({
          query: request,
          headers: commonHeaders,
        }),
    }
  })
}

export type MetricsApi = Effect.Success<ReturnType<typeof api>>
