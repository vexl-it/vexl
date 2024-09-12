import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
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
  getUserSessionCredentials,
  signal,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
    api: BtcExchangeRateApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
    signal,
    loggingFunction,
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
