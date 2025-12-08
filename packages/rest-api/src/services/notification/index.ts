import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect/index'
import {createClientInstance} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {
  type IssueNotificationRequest,
  type IssueStreamOnlyMessageRequest,
  type ReportNotificationProcessedRequest,
} from './contract'
import {NotificationApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  isDeveloper,
  language,
  appSource,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  isDeveloper: boolean
  language: string
  appSource: AppSource
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: NotificationApiSpecification,
        platform,
        clientVersion,
        isDeveloper,
        clientSemver,
        language,
        appSource,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )
    return {
      getNotificationPublicKey: () => client.getNotificationPublicKey({}),
      issueStreamOnlyMessage: (payload: IssueStreamOnlyMessageRequest) =>
        client.issueStreamOnlyMessage({payload}),
      issueNotification: (payload: IssueNotificationRequest) =>
        client.issueNotification({payload}),
      reportNotificationProcessed: (
        request: ReportNotificationProcessedRequest
      ) => client.reportNotificationProcessed({payload: request}),
    }
  })
}

export type NotificationApi = Effect.Effect.Success<ReturnType<typeof api>>
