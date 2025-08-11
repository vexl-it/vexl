import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {GetExchangeRateError, type GetExchangeRateInput} from './contracts'
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
}) {
  const client = createClientInstanceWithAuth({
    api: BtcExchangeRateApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    language,
    appSource,
    isDeveloper,
    getUserSessionCredentials,
    url,
    loggingFunction,
    deviceModel,
    osVersion,
  })

  return {
    getExchangeRate: (exchangeRateInput: GetExchangeRateInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.getExchangeRate(exchangeRateInput),
        GetExchangeRateError
      ),
  }
}
export type BtcExchangeRateApi = ReturnType<typeof api>
