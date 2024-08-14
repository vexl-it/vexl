import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CreateAxiosDefaults, type GenericAbortSignal} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidationSchema,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {GetExchangeRateResponse} from '../btcExchangeRate/contracts'
import {
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsResponse,
  LocationNotFoundError,
  type GetExchangeRateRequest,
  type GetGeocodedCoordinatesRequest,
  type GetLocationSuggestionsRequest,
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
    getLocationSuggestions: (
      request: GetLocationSuggestionsRequest,
      signal?: GenericAbortSignal
    ) => {
      return pipe(
        axiosCallWithValidationSchema(
          axiosInstance,
          {
            url: '/suggest',
            method: 'get',
            params: {phrase: request.phrase, lang: request.lang},
            ...(signal ? {signal} : {}),
          },
          GetLocationSuggestionsResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.status === 404) {
              return new LocationNotFoundError({status: 404})
            }
          }
          return e
        })
      )
    },
    getGeocodedCoordinates: (
      request: GetGeocodedCoordinatesRequest,
      signal?: AbortSignal
    ) => {
      return pipe(
        axiosCallWithValidationSchema(
          axiosInstance,
          {
            url: '/geocode',
            method: 'get',
            params: {...request},
            ...(signal ? {signal} : {}),
          },
          GetGeocodedCoordinatesResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.status === 404) {
              return new LocationNotFoundError({status: 404})
            }
          }
          return e
        })
      )
    },
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
        )
      )
    },
  }
}

export type LocationPrivateApi = ReturnType<typeof privateApi>
