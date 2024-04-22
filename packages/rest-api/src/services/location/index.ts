import {type CreateAxiosDefaults, type GenericAbortSignal} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsResponse,
  type GetGeocodedCoordinatesRequest,
  type GetLocationSuggestionsRequest,
  type LocationNotFoundError,
} from './contracts'

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
    getLocationSuggestions: (
      request: GetLocationSuggestionsRequest,
      signal?: GenericAbortSignal
    ) => {
      return pipe(
        axiosCallWithValidation(
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
              return {
                _tag: 'LocationNotFoundError',
              } satisfies LocationNotFoundError
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
        axiosCallWithValidation(
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
              return {
                _tag: 'LocationNotFoundError',
              } satisfies LocationNotFoundError
            }
          }
          return e
        })
      )
    },
  }
}

export type LocationPrivateApi = ReturnType<typeof privateApi>
