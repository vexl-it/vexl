import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
} from '../../utils'
import {IssueNotificationErrors, type IssueNotificationInput} from './contract'
import {NotificationApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
}) {
  const client = createClientInstanceWithAuth({
    api: NotificationApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
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
