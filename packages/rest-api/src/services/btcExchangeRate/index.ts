import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect/index'
import {createClientInstance} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {type GetExchangeRateInput} from './contracts'
import {BtcExchangeRateApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  isDeveloper,
  appSource,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  appSource: AppSource
  isDeveloper: boolean
  language: string
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
  prefix?: CountryPrefix
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: BtcExchangeRateApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        appSource,
        isDeveloper,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
        prefix,
      })
    )

    return {
      getExchangeRate: (exchangeRateInput: GetExchangeRateInput) =>
        client.getExchangeRate({urlParams: exchangeRateInput.query}),
    }
  })
}
export type BtcExchangeRateApi = Effect.Effect.Success<ReturnType<typeof api>>
