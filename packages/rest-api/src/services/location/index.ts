import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type PlatformName} from '../../PlatformName'
import {type CreateAxiosDefaults} from 'axios'
import {
  axiosCallWithValidation,
  createAxiosInstance,
  type LoggingFunction,
} from '../../utils'
import {pipe} from 'fp-ts/function'
import {
  type GetLocationSuggestionsRequest,
  GetLocationSuggestionsResponse,
} from './contracts'
import urlJoin from 'url-join'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function publicApi({
  url,
  platform,
  axiosConfig,
  clientVersion,
  loggingFunction,
}: {
  url: ServiceUrl
  platform: PlatformName
  clientVersion: number
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstance(
    platform,
    clientVersion,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/suggest'),
    },
    loggingFunction
  )
  return {
    getLocationSuggestions: (request: GetLocationSuggestionsRequest) => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'get',
            params: {phrase: request.phrase, lang: request.lang},
          },
          GetLocationSuggestionsResponse
        )
      )
    },
  }
}

export type LocationPublicApi = ReturnType<typeof publicApi>
