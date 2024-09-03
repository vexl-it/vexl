import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type PlatformNameE} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {handleCommonErrorsEffect} from '../../utils'
import {type SubmitFeedbackInput} from './contracts'
import {FeedbackApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
}: {
  platform: PlatformNameE
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
}) {
  const client = createClientInstanceWithAuth({
    api: FeedbackApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
  })

  return {
    submitFeedback: (submitFeedbackInput: SubmitFeedbackInput) =>
      handleCommonErrorsEffect(client.submitFeedback(submitFeedbackInput)),
  }
}

export type FeedbackApi = ReturnType<typeof api>
