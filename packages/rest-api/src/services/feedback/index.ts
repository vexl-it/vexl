import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect/index'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {type SubmitFeedbackRequest} from './contracts'
import {FeedbackApiSpecification} from './specification'

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
  loggingFunction,
  deviceModel,
  osVersion,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  isDeveloper: boolean
  language: string
  appSource: AppSource
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstanceWithAuth({
        api: FeedbackApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        isDeveloper,
        appSource,
        getUserSessionCredentials,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )

    return {
      submitFeedback: (body: SubmitFeedbackRequest) =>
        client.submitFeedback({payload: body}),
    }
  })
}

export type FeedbackApi = Effect.Effect.Success<ReturnType<typeof api>>
