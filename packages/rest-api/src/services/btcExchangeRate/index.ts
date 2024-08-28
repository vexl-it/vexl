import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {handleCommonErrorsEffect} from '../../utils'
import {GetExchangeRateError, type GetExchangeRateRequest} from './contracts'
import {BtcExchangeRateApiSpecification} from './specification'

interface GetExchangeRateInput {
  query: GetExchangeRateRequest
}

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
  const client = createClientInstanceWithAuth(
    BtcExchangeRateApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url
  )

  return {
    getExchangeRate: (exchangeRateInput: GetExchangeRateInput) =>
      handleCommonErrorsEffect(
        client.getExchangeRate(exchangeRateInput),
        GetExchangeRateError
      ),
  }
}
export type BtcExchangeRateApi = ReturnType<typeof api>
