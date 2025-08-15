import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Option} from 'effect/index'
import {createClientInstanceWithAuth} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {handleCommonErrorsEffect, type LoggingFunction} from '../../utils'
import {type ReportNotificationInteractionRequest} from './contracts'
import {MetricsServiceSpecification} from './specification'

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
}: {
  platform: PlatformName
  clientVersion: VersionCode
  language: string
  appSource: AppSource
  isDeveloper: boolean
  clientSemver: SemverString
  url: ServiceUrl
  deviceModel?: string
  osVersion?: string
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
    api: MetricsServiceSpecification,
    platform,
    clientVersion,
    language,
    isDeveloper,
    appSource,
    clientSemver,
    getUserSessionCredentials,
    url,
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
    reportNotificationInteraction: (
      request: ReportNotificationInteractionRequest
    ) =>
      handleCommonErrorsEffect(
        client.reportNotificationInteraction({
          query: request,
          headers: commonHeaders,
        })
      ),
  }
}

export type MetricsApi = ReturnType<typeof api>
