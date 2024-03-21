import {type CreateAxiosDefaults} from 'axios'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type ExtractLeftTE,
  type LoggingFunction,
} from '../../utils'
import {GetPublicKeyResponse} from './contract'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/'),
    },
    loggingFunction
  )

  return {
    getNotificationPublicKey: () => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            url: '/cypher-public-key',
            method: 'get',
          },
          GetPublicKeyResponse
        )
      )
    },
  }
}

export type NotificationPrivateApi = ReturnType<typeof privateApi>

export type ApiErrorFetchNotificationToken = ExtractLeftTE<
  ReturnType<NotificationPrivateApi['getNotificationPublicKey']>
>
