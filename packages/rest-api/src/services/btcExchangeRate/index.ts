import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CreateAxiosDefaults} from 'axios'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidationSchema,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  GetExchangeRateError,
  GetExchangeRateResponse,
  type GetExchangeRateRequest,
} from './contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    clientSemver,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/'),
    },
    loggingFunction
  )

  return {
    getExchangeRate: (
      request: GetExchangeRateRequest,
      signal?: AbortSignal
    ) => {
      return pipe(
        axiosCallWithValidationSchema(
          axiosInstance,
          {
            url: `/btc-rate`,
            params: {currency: request.currency},
            method: 'get',
            ...(signal ? {signal} : {}),
          },
          GetExchangeRateResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            return new GetExchangeRateError({
              reason: e.response.data.reason,
              status: 400,
            })
          }
          return e
        })
      )
    },
  }
}

export type BtcExchangeRatePrivateApi = ReturnType<typeof privateApi>
