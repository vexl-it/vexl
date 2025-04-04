import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {IssueNotificationErrors, type IssueNotificationInput} from './contract'
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
}) {
  const client = createClientInstanceWithAuth({
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
  })

  return {
    getNotificationPublicKey: () =>
      handleCommonErrorsEffect(client.getNotificationPublicKey({})),
    issueNotification: (issueNotificationInput: IssueNotificationInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.issueNotification(issueNotificationInput),
        IssueNotificationErrors
      ),
  }
}

export type NotificationApi = ReturnType<typeof api>
