import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Effect} from 'effect'
import {createClientInstance} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
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
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: VersionString
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
  return Effect.gen(function* () {
    const client = yield* createClientInstance({
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

    return {
      getExchangeRate: (exchangeRateInput: GetExchangeRateInput) =>
        client.getExchangeRate({query: exchangeRateInput.query}).pipe(
          Effect.catchTags({
            SchemaError: () =>
              Effect.fail(
                new GetExchangeRateError({
                  reason: 'YadioError',
                  status: 502,
                })
              ),
          })
        ),
    }
  })
}
export type BtcExchangeRateApi = Effect.Success<ReturnType<typeof api>>
