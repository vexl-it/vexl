import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect/index'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {
  IssueNotificationErrors,
  type IssueNotificationInput,
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
      createClientInstanceWithAuth({
        api: NotificationApiSpecification,
        platform,
        clientVersion,
        isDeveloper,
        clientSemver,
        language,
        appSource,
        getUserSessionCredentials,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )
    return {
      getNotificationPublicKey: () => client.getNotificationPublicKey({}),
      issueNotification: (issueNotificationInput: IssueNotificationInput) =>
        client.issueNotification({payload: issueNotificationInput.body}),
      IssueNotificationErrors,
      reportNotificationProcessed: (
        request: ReportNotificationProcessedRequest
      ) => client.reportNotificationProcessed({payload: request}),
    }
  })
}

export type NotificationApi = Effect.Effect.Success<ReturnType<typeof api>>
