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
  loggingFunction,
}: {
  url: ServiceUrl
  platform: PlatformName
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstance(
    platform,
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
